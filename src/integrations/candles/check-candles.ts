/**
 * Candle Data Statistics Script
 * Shows statistics about imported candle data
 * 
 * Usage:
 *   npm run build && node dist/integrations/candles/check-candles.js
 */

import 'dotenv/config'
import { connectDatabase } from '../../infrastructure/database/connection'
import { MongoCandleRepository } from '../../infrastructure/repositories/MongoCandleRepository'
import { CURRENCY_PAIRS, TIMEFRAMES } from '../../domain/entities/Candle'

class CandleChecker {
    private repository: MongoCandleRepository

    constructor() {
        this.repository = new MongoCandleRepository()
    }

    async run() {
        console.log('📊 Candle Data Statistics')
        console.log('=' .repeat(80))

        try {
            // Connect to MongoDB
            console.log('📡 Connecting to MongoDB...')
            await connectDatabase()
            console.log('✅ MongoDB connected\n')

            // Get overall statistics
            const info = await this.repository.getAvailableDataInfo()

            if (info.length === 0) {
                console.log('⚠️  No candle data found in database')
                console.log('💡 Run the import script first: node dist/integrations/candles/import-candles.js')
                process.exit(0)
            }

            console.log(`📈 Found data for ${info.length} pair/timeframe combinations:\n`)

            // Group by pair
            const byPair: Record<string, typeof info> = {}
            for (const item of info) {
                if (!byPair[item.pair]) {
                    byPair[item.pair] = []
                }
                byPair[item.pair].push(item)
            }

            // Display statistics
            let totalCandles = 0
            for (const [pair, items] of Object.entries(byPair)) {
                console.log(`\n${pair}`)
                console.log('-'.repeat(80))

                for (const item of items) {
                    totalCandles += item.count

                    const dateRange = item.oldest && item.newest
                        ? `${item.oldest.toISOString().split('T')[0]} to ${item.newest.toISOString().split('T')[0]}`
                        : 'N/A'

                    const days = item.oldest && item.newest
                        ? Math.ceil((item.newest.getTime() - item.oldest.getTime()) / (1000 * 60 * 60 * 24))
                        : 0

                    console.log(`  ${item.timeframe.padEnd(4)} | ${item.count.toLocaleString().padStart(10)} candles | ${dateRange} (${days} days)`)
                }
            }

            console.log('\n' + '='.repeat(80))
            console.log(`📊 Total: ${totalCandles.toLocaleString()} candles across ${info.length} datasets`)
            console.log()

            // Check for missing data
            console.log('🔍 Checking for missing combinations:')
            console.log('-'.repeat(80))
            
            const existingCombos = new Set(info.map(i => `${i.pair}_${i.timeframe}`))
            let missingCount = 0

            for (const pair of CURRENCY_PAIRS) {
                const missing: string[] = []
                for (const tf of TIMEFRAMES) {
                    if (!existingCombos.has(`${pair}_${tf}`)) {
                        missing.push(tf)
                        missingCount++
                    }
                }
                if (missing.length > 0) {
                    console.log(`  ${pair}: Missing ${missing.join(', ')}`)
                }
            }

            if (missingCount === 0) {
                console.log('  ✅ All combinations present!')
            } else {
                console.log(`\n  ⚠️  ${missingCount} combination(s) missing`)
            }

            console.log()

            // Sample data from each pair/timeframe
            console.log('\n📝 Sample Data (latest candle from each dataset):')
            console.log('='.repeat(80))

            for (const item of info.slice(0, 5)) {
                const latest = await this.repository.findLatest(item.pair, item.timeframe, 1)
                if (latest.length > 0) {
                    const candle = latest[0]
                    const [open, high, low, close, volume] = candle.ohlcv
                    console.log(`\n${item.pair} ${item.timeframe} - ${candle.timestamp.toISOString()}`)
                    console.log(`  O: ${open} | H: ${high} | L: ${low} | C: ${close} | V: ${volume}`)
                }
            }

            if (info.length > 5) {
                console.log(`\n  ... and ${info.length - 5} more datasets`)
            }

            console.log()
            process.exit(0)

        } catch (error: any) {
            console.error('❌ Error:', error.message)
            console.error(error.stack)
            process.exit(1)
        }
    }
}

// Run the checker
const checker = new CandleChecker()
checker.run()
