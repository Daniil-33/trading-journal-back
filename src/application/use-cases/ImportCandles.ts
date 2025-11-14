/**
 * Import Candles Use Case - Application Layer
 * Handles bulk import of candle data with validation and progress tracking
 */

import { ICandleRepository } from '../../domain/repositories/ICandleRepository'
import { ICandle, CURRENCY_PAIRS, TIMEFRAMES } from '../../domain/entities/Candle'

export interface ImportResult {
    total: number
    inserted: number
    duplicates: number
    errors: string[]
}

export class ImportCandles {
    constructor(private candleRepository: ICandleRepository) {}

    /**
     * Import candles in batches with validation
     * @param candles Array of candles to import
     * @param batchSize Number of candles per batch (default: 10000)
     * @returns ImportResult with statistics
     */
    async execute(candles: ICandle[], batchSize = 10000): Promise<ImportResult> {
        const result: ImportResult = {
            total: candles.length,
            inserted: 0,
            duplicates: 0,
            errors: []
        }

        // Validate all candles first
        const validCandles: ICandle[] = []
        for (const candle of candles) {
            const validation = this.validateCandle(candle)
            if (validation.valid) {
                validCandles.push(candle)
            } else {
                result.errors.push(`Invalid candle at ${candle.timestamp}: ${validation.error}`)
            }
        }

        // Import in batches
        for (let i = 0; i < validCandles.length; i += batchSize) {
            const batch = validCandles.slice(i, i + batchSize)
            
            try {
                const inserted = await this.candleRepository.bulkCreate(batch)
                result.inserted += inserted
                result.duplicates += batch.length - inserted
            } catch (error: any) {
                result.errors.push(`Batch ${i}-${i + batch.length} error: ${error.message}`)
            }
        }

        return result
    }

    /**
     * Validate a single candle
     */
    private validateCandle(candle: ICandle): { valid: boolean; error?: string } {
        // Check required fields
        if (!candle.pair || !candle.timeframe || !candle.timestamp || !candle.ohlcv) {
            return { valid: false, error: 'Missing required fields' }
        }

        // Validate pair
        if (!CURRENCY_PAIRS.includes(candle.pair as any)) {
            return { valid: false, error: `Invalid pair: ${candle.pair}` }
        }

        // Validate timeframe
        if (!TIMEFRAMES.includes(candle.timeframe as any)) {
            return { valid: false, error: `Invalid timeframe: ${candle.timeframe}` }
        }

        // Validate timestamp
        if (!(candle.timestamp instanceof Date) || isNaN(candle.timestamp.getTime())) {
            return { valid: false, error: 'Invalid timestamp' }
        }

        // Validate OHLCV array
        if (!Array.isArray(candle.ohlcv) || candle.ohlcv.length !== 5) {
            return { valid: false, error: 'OHLCV must be array of 5 numbers' }
        }

        const [open, high, low, close, volume] = candle.ohlcv

        // Check all values are numbers
        if ([open, high, low, close, volume].some(v => typeof v !== 'number' || isNaN(v))) {
            return { valid: false, error: 'OHLCV values must be valid numbers' }
        }

        // Validate OHLC logic: high >= max(open, close) and low <= min(open, close)
        if (high < Math.max(open, close) || low > Math.min(open, close)) {
            return { valid: false, error: 'Invalid OHLC relationship' }
        }

        // Volume should be non-negative
        if (volume < 0) {
            return { valid: false, error: 'Volume cannot be negative' }
        }

        return { valid: true }
    }

    /**
     * Get import statistics for a specific pair and timeframe
     */
    async getImportStats(pair: string, timeframe: string) {
        const count = await this.candleRepository.count(pair, timeframe as any)
        const info = await this.candleRepository.getAvailableDataInfo()
        
        const pairInfo = info.find(i => i.pair === pair && i.timeframe === timeframe)
        
        return {
            pair,
            timeframe,
            totalCandles: count,
            oldest: pairInfo?.oldest,
            newest: pairInfo?.newest
        }
    }
}
