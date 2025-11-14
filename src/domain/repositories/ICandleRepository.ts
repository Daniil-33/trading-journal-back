/**
 * Candle Repository Interface - Domain Layer
 */

import { ICandle, Timeframe } from '../entities/Candle'

export interface CandleQueryOptions {
    pair: string
    timeframe: Timeframe
    from?: Date
    to?: Date
    limit?: number
    skip?: number
}

export interface ICandleRepository {
    create(candle: ICandle): Promise<ICandle>
    bulkCreate(candles: ICandle[]): Promise<number>
    findByQuery(options: CandleQueryOptions): Promise<ICandle[]>
    findLatest(pair: string, timeframe: Timeframe, limit?: number): Promise<ICandle[]>
    findByTimestamp(pair: string, timeframe: Timeframe, timestamp: Date): Promise<ICandle | null>
    count(pair: string, timeframe: Timeframe): Promise<number>
    deleteAll(): Promise<number>
    getAvailableDataInfo(): Promise<{
        pair: string
        timeframe: Timeframe
        count: number
        oldest: Date | null
        newest: Date | null
    }[]>
}
