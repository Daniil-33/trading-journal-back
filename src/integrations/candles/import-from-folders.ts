/**
 * Advanced CSV Import Script
 * Imports candle data from nested folder structure
 * 
 * Usage:
 *   npm run build && node dist/integrations/candles/import-from-folders.js
 * 
 * Folder structure:
 *   candles-import/
 *     EURUSD/
 *       h1/
 *         EURUSD_Candlestick_1_Hour_BID_01.01.2024-31.12.2024.csv
 *         EURUSD_Candlestick_1_Hour_BID_01.01.2025-31.10.2025.csv
 *       d1/
 *         ...
 *     GBPUSD/
 *       ...
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { connectDatabase } from '../../infrastructure/database/connection'
import { MongoCandleRepository } from '../../infrastructure/repositories/MongoCandleRepository'
import { ImportCandles } from '../../application/use-cases/ImportCandles'
import { CSVParser } from '../../shared/utils/csv-parser'
import { CurrencyPair, Timeframe, CURRENCY_PAIRS } from '../../domain/entities/Candle'

// Update this path to your actual import folder
const IMPORT_FOLDER = path.join(process.cwd(), 'src', 'integrations', 'candles-import')
const BATCH_SIZE = 10000

// Mapping folder names to timeframes
const FOLDER_TO_TIMEFRAME: Record<string, Timeframe> = {
    'm5': '5m',
    'm15': '15m',
    'm30': '30m',
    'h1': '1h',
    'h4': '4h',
    'd1': '1d',
    'w1': '1w'
}

interface FileToImport {
    filePath: string
    fileName: string
    pair: CurrencyPair
    timeframe: Timeframe
}

class AdvancedCandleImporter {
    private repository: MongoCandleRepository
    private importUseCase: ImportCandles
    private parser: CSVParser

    constructor() {
        this.repository = new MongoCandleRepository()
        this.importUseCase = new ImportCandles(this.repository)
        this.parser = new CSVParser()
    }

    async run() {
        console.log('🚀 Advanced Candle Data Import Script')
        console.log('=' .repeat(80))
        console.log(`📂 Import folder: ${IMPORT_FOLDER}\n`)
        
        try {
            // Connect to MongoDB
            console.log('📡 Connecting to MongoDB...')
            await connectDatabase()
            console.log('✅ MongoDB connected\n')

            // Check import folder
            if (!fs.existsSync(IMPORT_FOLDER)) {
                console.error(`❌ Import folder not found: ${IMPORT_FOLDER}`)
                process.exit(1)
            }

            // Scan for all CSV files
            console.log('🔍 Scanning for CSV files...')
            const files = this.scanFolderStructure()
            
            if (files.length === 0) {
                console.log('⚠️  No CSV files found')
                process.exit(0)
            }

            // Group files by pair and timeframe
            const grouped = this.groupFiles(files)
            
            console.log(`\n📁 Found ${files.length} CSV file(s) across ${Object.keys(grouped).length} datasets:\n`)
            for (const [key, fileList] of Object.entries(grouped)) {
                const [pair, tf] = key.split('_')
                console.log(`   ${pair} ${tf}: ${fileList.length} file(s)`)
            }
            console.log()

            // Import each dataset
            let totalImported = 0
            let totalDuplicates = 0
            let totalErrors = 0
            let datasetCount = 0

            for (const [key, fileList] of Object.entries(grouped)) {
                datasetCount++
                const [pair, timeframe] = key.split('_')
                
                console.log(`\n[${datasetCount}/${Object.keys(grouped).length}] Processing ${pair} ${timeframe} (${fileList.length} files)`)
                console.log('='.repeat(80))

                let datasetInserted = 0
                let datasetDuplicates = 0
                let datasetErrors = 0

                for (let i = 0; i < fileList.length; i++) {
                    const file = fileList[i]
                    console.log(`\n  File ${i + 1}/${fileList.length}: ${file.fileName}`)
                    console.log('  ' + '-'.repeat(76))
                    
                    const result = await this.importFile(file)
                    
                    datasetInserted += result.inserted
                    datasetDuplicates += result.duplicates
                    datasetErrors += result.errors.length

                    console.log(`  ✅ Inserted: ${result.inserted.toLocaleString()}`)
                    console.log(`  ⚠️  Duplicates: ${result.duplicates.toLocaleString()}`)
                    
                    if (result.errors.length > 0) {
                        console.log(`  ❌ Errors: ${result.errors.length}`)
                        if (result.errors.length <= 5) {
                            result.errors.forEach(err => console.log(`     ${err}`))
                        }
                    }
                }

                totalImported += datasetInserted
                totalDuplicates += datasetDuplicates
                totalErrors += datasetErrors

                // Dataset summary
                console.log(`\n  📊 Dataset Summary:`)
                console.log(`  ` + '-'.repeat(76))
                console.log(`  Total Inserted: ${datasetInserted.toLocaleString()}`)
                console.log(`  Total Duplicates: ${datasetDuplicates.toLocaleString()}`)
                console.log(`  Total Errors: ${datasetErrors}`)

                // Get final stats from DB
                const stats = await this.importUseCase.getImportStats(pair, timeframe)
                console.log(`  Total in DB: ${stats.totalCandles.toLocaleString()}`)
                
                if (stats.oldest && stats.newest) {
                    const oldestStr = stats.oldest.toISOString().split('T')[0]
                    const newestStr = stats.newest.toISOString().split('T')[0]
                    const days = Math.ceil((stats.newest.getTime() - stats.oldest.getTime()) / (1000 * 60 * 60 * 24))
                    console.log(`  Date range: ${oldestStr} to ${newestStr} (${days} days)`)
                }
            }

            // Final summary
            console.log('\n\n' + '='.repeat(80))
            console.log('🎉 IMPORT COMPLETED')
            console.log('='.repeat(80))
            console.log(`📊 Total Datasets: ${Object.keys(grouped).length}`)
            console.log(`📄 Total Files Processed: ${files.length}`)
            console.log(`✅ Total Candles Inserted: ${totalImported.toLocaleString()}`)
            console.log(`⚠️  Total Duplicates Skipped: ${totalDuplicates.toLocaleString()}`)
            console.log(`❌ Total Errors: ${totalErrors}`)
            console.log()

            // Database summary
            console.log('📈 Final Database Summary:')
            console.log('='.repeat(80))
            const allStats = await this.repository.getAvailableDataInfo()
            
            // Group by pair
            const byPair: Record<string, typeof allStats> = {}
            for (const stat of allStats) {
                if (!byPair[stat.pair]) {
                    byPair[stat.pair] = []
                }
                byPair[stat.pair].push(stat)
            }

            for (const [pair, stats] of Object.entries(byPair)) {
                console.log(`\n${pair}:`)
                for (const stat of stats) {
                    console.log(`  ${stat.timeframe.padEnd(4)}: ${stat.count.toLocaleString().padStart(10)} candles`)
                }
            }

            console.log()
            process.exit(0)

        } catch (error: any) {
            console.error('\n❌ Import failed:', error.message)
            console.error(error.stack)
            process.exit(1)
        }
    }

    /**
     * Scan folder structure for CSV files
     */
    private scanFolderStructure(): FileToImport[] {
        const files: FileToImport[] = []

        // Read pair folders (EURUSD, GBPUSD, etc.)
        const entries = fs.readdirSync(IMPORT_FOLDER)
        
        for (const entry of entries) {
            if (entry.startsWith('.')) continue
            
            const pairPath = path.join(IMPORT_FOLDER, entry)
            const stat = fs.statSync(pairPath)
            
            if (!stat.isDirectory()) continue
            
            const pair = entry.toUpperCase() as CurrencyPair
            if (!CURRENCY_PAIRS.includes(pair)) {
                console.warn(`⚠️  Skipping unknown pair: ${entry}`)
                continue
            }

            // Read timeframe folders (m5, h1, d1, etc.)
            const tfFolders = fs.readdirSync(pairPath)
            
            for (const tfFolder of tfFolders) {
                if (tfFolder.startsWith('.')) continue
                
                const tfPath = path.join(pairPath, tfFolder)
                const tfStat = fs.statSync(tfPath)
                
                if (!tfStat.isDirectory()) continue
                
                const timeframe = FOLDER_TO_TIMEFRAME[tfFolder.toLowerCase()]
                if (!timeframe) {
                    console.warn(`⚠️  Skipping unknown timeframe folder: ${tfFolder}`)
                    continue
                }

                // Read CSV files in timeframe folder
                const csvFiles = fs.readdirSync(tfPath)
                
                for (const csvFile of csvFiles) {
                    if (!csvFile.endsWith('.csv')) continue
                    
                    files.push({
                        filePath: path.join(tfPath, csvFile),
                        fileName: csvFile,
                        pair,
                        timeframe
                    })
                }
            }
        }

        return files
    }

    /**
     * Group files by pair and timeframe
     */
    private groupFiles(files: FileToImport[]): Record<string, FileToImport[]> {
        const grouped: Record<string, FileToImport[]> = {}
        
        for (const file of files) {
            const key = `${file.pair}_${file.timeframe}`
            if (!grouped[key]) {
                grouped[key] = []
            }
            grouped[key].push(file)
        }

        return grouped
    }

    /**
     * Import a single CSV file
     */
    private async importFile(file: FileToImport) {
        // Get file info
        const fileInfo = await this.parser.getFileInfo(file.filePath)
        
        // Parse CSV
        const candles = await this.parser.parseFile(file.filePath, {
            pair: file.pair,
            timeframe: file.timeframe,
            skipHeader: true
        })

        // Import to database
        const result = await this.importUseCase.execute(candles, BATCH_SIZE)
        
        return result
    }
}

// Run the importer
const importer = new AdvancedCandleImporter()
importer.run()
