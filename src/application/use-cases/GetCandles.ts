/**
 * Get Candles Use Case
 * Retrieves candles with various filters
 */

import { ICandleRepository, CandleQueryOptions } from '../../domain/repositories/ICandleRepository'
import { ICandle, Timeframe } from '../../domain/entities/Candle'

export class GetCandles {
    constructor(private candleRepository: ICandleRepository) {}

    async execute(options: CandleQueryOptions): Promise<ICandle[]> {
        return await this.candleRepository.findByQuery(options)
    }

    async getLatest(pair: string, timeframe: Timeframe, limit: number = 100): Promise<ICandle[]> {
        return await this.candleRepository.findLatest(pair, timeframe, limit)
    }

    async getCount(pair: string, timeframe: Timeframe): Promise<number> {
        return await this.candleRepository.count(pair, timeframe)
    }
}
