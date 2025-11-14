/**
 * CSV Parser Utility
 * Parses CSV files with format: "Gmt time,Open,High,Low,Close,Volume"
 */

import * as fs from 'fs'
import * as readline from 'readline'
import { ICandle, Timeframe, CurrencyPair } from '../../domain/entities/Candle'

export interface CSVParseOptions {
    pair: CurrencyPair
    timeframe: Timeframe
    skipHeader?: boolean
    dateFormat?: 'iso' | 'custom'
}

export class CSVParser {
    /**
     * Parse CSV file and return array of candles
     * @param filePath Path to CSV file
     * @param options Parse options (pair, timeframe, etc.)
     */
    async parseFile(filePath: string, options: CSVParseOptions): Promise<ICandle[]> {
        const candles: ICandle[] = []
        const fileStream = fs.createReadStream(filePath)
        
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })

        let lineNumber = 0
        let skippedFirst = !options.skipHeader

        for await (const line of rl) {
            lineNumber++
            
            // Skip header if needed
            if (!skippedFirst) {
                skippedFirst = true
                continue
            }

            // Skip empty lines
            if (!line.trim()) {
                continue
            }

            try {
                const candle = this.parseLine(line, options)
                if (candle) {
                    candles.push(candle)
                }
            } catch (error: any) {
                console.warn(`Warning: Line ${lineNumber} skipped - ${error.message}`)
            }
        }

        return candles
    }

    /**
     * Parse single CSV line
     * Expected format: "Gmt time,Open,High,Low,Close,Volume"
     * Example: "2005.01.03 00:00,1.3556,1.3576,1.3555,1.3569,53"
     */
    private parseLine(line: string, options: CSVParseOptions): ICandle | null {
        const parts = line.split(',').map(p => p.trim())

        if (parts.length < 6) {
            throw new Error(`Invalid CSV format: expected 6 columns, got ${parts.length}`)
        }

        const [dateStr, openStr, highStr, lowStr, closeStr, volumeStr] = parts

        // Parse timestamp
        const timestamp = this.parseDate(dateStr)
        if (!timestamp || isNaN(timestamp.getTime())) {
            throw new Error(`Invalid date format: ${dateStr}`)
        }

        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = timestamp.getUTCDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return null // Skip this candle
        }

        // Parse OHLCV
        const open = parseFloat(openStr)
        const high = parseFloat(highStr)
        const low = parseFloat(lowStr)
        const close = parseFloat(closeStr)
        const volume = parseFloat(volumeStr)

        // Validate numbers
        if ([open, high, low, close, volume].some(v => isNaN(v))) {
            throw new Error('Invalid numeric values in OHLCV')
        }

        return {
            pair: options.pair,
            timeframe: options.timeframe,
            timestamp,
            ohlcv: [open, high, low, close, volume]
        }
    }

    /**
     * Parse date string to Date object
     * Supports formats:
     * - "2005.01.03 00:00" (Dukascopy format YYYY.MM.DD)
     * - "03.01.2005 00:00:00.000" (European format DD.MM.YYYY)
     * - "2005-01-03 00:00:00" (ISO-like)
     * - ISO 8601 strings
     */
    private parseDate(dateStr: string): Date {
        // Try Dukascopy format first: "2005.01.03 00:00" (YYYY.MM.DD)
        const dukasMatch = dateStr.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/)
        if (dukasMatch) {
            const [, year, month, day, hour, minute, second = '00'] = dukasMatch
            return new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            ))
        }

        // Try European format: "03.01.2005 00:00:00.000" (DD.MM.YYYY)
        const euroMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/)
        if (euroMatch) {
            const [, day, month, year, hour, minute, second = '00'] = euroMatch
            return new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            ))
        }

        // Try ISO-like format: "2005-01-03 00:00:00"
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/)
        if (isoMatch) {
            const [, year, month, day, hour, minute, second = '00'] = isoMatch
            return new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            ))
        }

        // Try direct ISO parsing as last resort
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
            return date
        }

        throw new Error(`Unsupported date format: ${dateStr}`)
    }

    /**
     * Get file info without parsing (quick check)
     */
    async getFileInfo(filePath: string): Promise<{ lines: number; size: number }> {
        const stats = fs.statSync(filePath)
        const fileStream = fs.createReadStream(filePath)
        
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })

        let lines = 0
        for await (const _ of rl) {
            lines++
        }

        return {
            lines,
            size: stats.size
        }
    }
}
