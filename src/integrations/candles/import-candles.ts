/**
 * CSV Import Script
 * Imports candle data from CSV files in the candles-import folder
 * 
 * Usage:
 *   npm run build && node dist/integrations/candles/import-candles.js
 * 
 * File naming convention:
 *   {PAIR}_{TIMEFRAME}.csv
 *   Examples: EURUSD_1h.csv, GBPUSD_5m.csv, USDJPY_1d.csv
 * 
 * CSV Format:
 *   Gmt time,Open,High,Low,Close,Volume
 *   2005.01.03 00:00,1.3556,1.3576,1.3555,1.3569,53
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { connectDatabase } from '../../infrastructure/database/connection'
import { MongoCandleRepository } from '../../infrastructure/repositories/MongoCandleRepository'
import { ImportCandles } from '../../application/use-cases/ImportCandles'
import { CSVParser } from '../../shared/utils/csv-parser'
import { CurrencyPair, Timeframe, CURRENCY_PAIRS, TIMEFRAMES } from '../../domain/entities/Candle'

const IMPORT_FOLDER = path.join(process.cwd(), 'candles-import')
const BATCH_SIZE = 10000 // Import 10k candles at a time

interface FileInfo {
    filename: string
    pair: CurrencyPair
    timeframe: Timeframe
    path: string
}

class CandleImporter {
    private repository: MongoCandleRepository
    private importUseCase: ImportCandles
    private parser: CSVParser

    constructor() {
        this.repository = new MongoCandleRepository()
        this.importUseCase = new ImportCandles(this.repository)
        this.parser = new CSVParser()
    }

    /**
     * Main import process
     */
    async run() {
        console.log('🚀 Candle Data Import Script Started')
        console.log('=' .repeat(80))
        
        try {
            // Connect to MongoDB
            console.log('📡 Connecting to MongoDB...')
            await connectDatabase()
            console.log('✅ MongoDB connected\n')

            // Check import folder
            if (!fs.existsSync(IMPORT_FOLDER)) {
                console.error(`❌ Import folder not found: ${IMPORT_FOLDER}`)
                console.log('📝 Please create the folder and add CSV files')
                process.exit(1)
            }

            // Scan for CSV files
            const files = this.scanImportFolder()
            
            if (files.length === 0) {
                console.log('⚠️  No CSV files found in import folder')
                console.log(`📂 Looking in: ${IMPORT_FOLDER}`)
                console.log('\n📝 File naming convention: {PAIR}_{TIMEFRAME}.csv')
                console.log('   Examples: EURUSD_1h.csv, GBPUSD_5m.csv, USDJPY_1d.csv')
                process.exit(0)
            }

            console.log(`📁 Found ${files.length} CSV file(s) to import:\n`)
            files.forEach(f => {
                console.log(`   • ${f.filename} (${f.pair} - ${f.timeframe})`)
            })
            console.log()

            // Import each file
            let totalImported = 0
            let totalDuplicates = 0
            let totalErrors = 0

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                console.log(`\n[${i + 1}/${files.length}] Processing ${file.filename}...`)
                console.log('-'.repeat(80))
                
                const result = await this.importFile(file)
                totalImported += result.inserted
                totalDuplicates += result.duplicates
                totalErrors += result.errors.length

                // Show file statistics
                console.log(`✅ Completed: ${file.filename}`)
                console.log(`   Inserted: ${result.inserted.toLocaleString()}`)
                console.log(`   Duplicates: ${result.duplicates.toLocaleString()}`)
                console.log(`   Errors: ${result.errors.length}`)
                
                if (result.errors.length > 0 && result.errors.length <= 10) {
                    result.errors.forEach(err => console.log(`   ⚠️  ${err}`))
                } else if (result.errors.length > 10) {
                    console.log(`   ⚠️  (showing first 10 errors)`)
                    result.errors.slice(0, 10).forEach(err => console.log(`   ${err}`))
                }

                // Show import stats
                const stats = await this.importUseCase.getImportStats(file.pair, file.timeframe)
                console.log(`   Total in DB: ${stats.totalCandles.toLocaleString()}`)
                if (stats.oldest && stats.newest) {
                    console.log(`   Date range: ${stats.oldest.toISOString()} to ${stats.newest.toISOString()}`)
                }
            }

            // Final summary
            console.log('\n' + '='.repeat(80))
            console.log('🎉 IMPORT COMPLETED')
            console.log('='.repeat(80))
            console.log(`📊 Total Files Processed: ${files.length}`)
            console.log(`✅ Total Candles Inserted: ${totalImported.toLocaleString()}`)
            console.log(`⚠️  Total Duplicates Skipped: ${totalDuplicates.toLocaleString()}`)
            console.log(`❌ Total Errors: ${totalErrors}`)
            console.log()

            // Show final statistics per pair/timeframe
            console.log('📈 Database Summary:')
            console.log('-'.repeat(80))
            for (const file of files) {
                const stats = await this.importUseCase.getImportStats(file.pair, file.timeframe)
                console.log(`${file.pair} ${file.timeframe}: ${stats.totalCandles.toLocaleString()} candles`)
            }

            process.exit(0)
        } catch (error: any) {
            console.error('❌ Import failed:', error.message)
            console.error(error.stack)
            process.exit(1)
        }
    }

    /**
     * Import a single CSV file
     */
    private async importFile(file: FileInfo) {
        // Get file info
        const fileInfo = await this.parser.getFileInfo(file.path)
        console.log(`📄 File size: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`)
        console.log(`📝 Total lines: ${fileInfo.lines.toLocaleString()}`)
        console.log(`⚙️  Parsing CSV...`)

        // Parse CSV
        const startParse = Date.now()
        const candles = await this.parser.parseFile(file.path, {
            pair: file.pair,
            timeframe: file.timeframe,
            skipHeader: true
        })
        const parseTime = ((Date.now() - startParse) / 1000).toFixed(2)
        console.log(`✅ Parsed ${candles.length.toLocaleString()} candles in ${parseTime}s`)

        // Import to database
        console.log(`💾 Importing to MongoDB (batch size: ${BATCH_SIZE.toLocaleString()})...`)
        const startImport = Date.now()
        const result = await this.importUseCase.execute(candles, BATCH_SIZE)
        const importTime = ((Date.now() - startImport) / 1000).toFixed(2)
        console.log(`✅ Import completed in ${importTime}s`)

        return result
    }

    /**
     * Scan import folder for CSV files
     */
    private scanImportFolder(): FileInfo[] {
        const files: FileInfo[] = []
        const entries = fs.readdirSync(IMPORT_FOLDER)

        for (const filename of entries) {
            if (!filename.endsWith('.csv')) {
                continue
            }

            const parsed = this.parseFilename(filename)
            if (parsed) {
                files.push({
                    filename,
                    pair: parsed.pair,
                    timeframe: parsed.timeframe,
                    path: path.join(IMPORT_FOLDER, filename)
                })
            } else {
                console.warn(`⚠️  Skipping invalid filename: ${filename}`)
            }
        }

        return files
    }

    /**
     * Parse filename to extract pair and timeframe
     * Expected format: {PAIR}_{TIMEFRAME}.csv
     * Examples: EURUSD_1h.csv, GBPUSD_5m.csv
     */
    private parseFilename(filename: string): { pair: CurrencyPair; timeframe: Timeframe } | null {
        const name = filename.replace('.csv', '')
        const parts = name.split('_')

        if (parts.length !== 2) {
            return null
        }

        const [pairStr, tfStr] = parts
        const pair = pairStr.toUpperCase() as CurrencyPair
        const timeframe = tfStr.toLowerCase() as Timeframe

        // Validate pair
        if (!CURRENCY_PAIRS.includes(pair)) {
            return null
        }

        // Validate timeframe
        if (!TIMEFRAMES.includes(timeframe)) {
            return null
        }

        return { pair, timeframe }
    }
}

// Run the importer
const importer = new CandleImporter()
importer.run()
