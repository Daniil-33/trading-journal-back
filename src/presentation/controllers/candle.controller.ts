/**
 * Candle Controller - Presentation Layer
 * Handles HTTP requests for candle data
 */

import { Request, Response, NextFunction } from 'express'
import { MongoCandleRepository } from '../../infrastructure/repositories/MongoCandleRepository'
import { GetCandles } from '../../application/use-cases/GetCandles'
import { CURRENCY_PAIRS, TIMEFRAMES, Timeframe, CurrencyPair } from '../../domain/entities/Candle'

export class CandleController {
    private getCandlesUseCase: GetCandles

    constructor() {
        const repository = new MongoCandleRepository()
        this.getCandlesUseCase = new GetCandles(repository)
    }

    /**
     * GET /api/candles/:pair/:timeframe
     * Query params: from, to, limit, skip
     */
    async getCandles(req: Request, res: Response, next: NextFunction) {
        try {
            const { pair, timeframe } = req.params
            const { from, to, limit, skip } = req.query

            // Validate pair
            if (!CURRENCY_PAIRS.includes(pair.toUpperCase() as CurrencyPair)) {
                return res.status(400).json({
                    error: 'Invalid currency pair',
                    validPairs: CURRENCY_PAIRS
                })
            }

            // Validate timeframe
            if (!TIMEFRAMES.includes(timeframe.toLowerCase() as Timeframe)) {
                return res.status(400).json({
                    error: 'Invalid timeframe',
                    validTimeframes: TIMEFRAMES
                })
            }

            // Build query options
            const options: any = {
                pair: pair.toUpperCase(),
                timeframe: timeframe.toLowerCase()
            }

            if (from) {
                options.from = new Date(from as string)
                if (isNaN(options.from.getTime())) {
                    return res.status(400).json({ error: 'Invalid "from" date format' })
                }
            }

            if (to) {
                options.to = new Date(to as string)
                if (isNaN(options.to.getTime())) {
                    return res.status(400).json({ error: 'Invalid "to" date format' })
                }
            }

            if (limit) {
                options.limit = parseInt(limit as string)
                if (isNaN(options.limit) || options.limit < 1 || options.limit > 10000) {
                    return res.status(400).json({ error: 'Invalid limit (must be 1-10000)' })
                }
            }

            if (skip) {
                options.skip = parseInt(skip as string)
                if (isNaN(options.skip) || options.skip < 0) {
                    return res.status(400).json({ error: 'Invalid skip (must be >= 0)' })
                }
            }

            // Execute query
            const candles = await this.getCandlesUseCase.execute(options)

            res.json({
                pair: options.pair,
                timeframe: options.timeframe,
                count: candles.length,
                candles
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candles/:pair/:timeframe/latest
     * Query params: limit (default: 100)
     */
    async getLatest(req: Request, res: Response, next: NextFunction) {
        try {
            const { pair, timeframe } = req.params
            const limit = parseInt(req.query.limit as string) || 100

            // Validate pair
            if (!CURRENCY_PAIRS.includes(pair.toUpperCase() as CurrencyPair)) {
                return res.status(400).json({
                    error: 'Invalid currency pair',
                    validPairs: CURRENCY_PAIRS
                })
            }

            // Validate timeframe
            if (!TIMEFRAMES.includes(timeframe.toLowerCase() as Timeframe)) {
                return res.status(400).json({
                    error: 'Invalid timeframe',
                    validTimeframes: TIMEFRAMES
                })
            }

            // Validate limit
            if (limit < 1 || limit > 10000) {
                return res.status(400).json({ error: 'Invalid limit (must be 1-10000)' })
            }

            // Get latest candles
            const candles = await this.getCandlesUseCase.getLatest(
                pair.toUpperCase(),
                timeframe.toLowerCase() as Timeframe,
                limit
            )

            res.json({
                pair: pair.toUpperCase(),
                timeframe: timeframe.toLowerCase(),
                count: candles.length,
                candles
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candles/:pair/:timeframe/count
     */
    async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const { pair, timeframe } = req.params

            // Validate pair
            if (!CURRENCY_PAIRS.includes(pair.toUpperCase() as CurrencyPair)) {
                return res.status(400).json({
                    error: 'Invalid currency pair',
                    validPairs: CURRENCY_PAIRS
                })
            }

            // Validate timeframe
            if (!TIMEFRAMES.includes(timeframe.toLowerCase() as Timeframe)) {
                return res.status(400).json({
                    error: 'Invalid timeframe',
                    validTimeframes: TIMEFRAMES
                })
            }

            // Get count
            const count = await this.getCandlesUseCase.getCount(
                pair.toUpperCase(),
                timeframe.toLowerCase() as Timeframe
            )

            res.json({
                pair: pair.toUpperCase(),
                timeframe: timeframe.toLowerCase(),
                count
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candles/statistics
     */
    async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const repository = new MongoCandleRepository()
            const stats = await repository.getAvailableDataInfo()

            // Group by pair
            const byPair: Record<string, any[]> = {}
            let totalCandles = 0

            for (const stat of stats) {
                if (!byPair[stat.pair]) {
                    byPair[stat.pair] = []
                }
                byPair[stat.pair].push({
                    timeframe: stat.timeframe,
                    count: stat.count,
                    oldest: stat.oldest,
                    newest: stat.newest,
                    daysRange: stat.oldest && stat.newest
                        ? Math.ceil((stat.newest.getTime() - stat.oldest.getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                })
                totalCandles += stat.count
            }

            res.json({
                totalCandles,
                pairs: Object.keys(byPair).length,
                datasets: stats.length,
                data: byPair
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candles/pairs
     * Returns list of available pairs and timeframes
     */
    async getAvailablePairs(req: Request, res: Response, next: NextFunction) {
        try {
            const repository = new MongoCandleRepository()
            const stats = await repository.getAvailableDataInfo()

            const available: Record<string, string[]> = {}
            for (const stat of stats) {
                if (!available[stat.pair]) {
                    available[stat.pair] = []
                }
                available[stat.pair].push(stat.timeframe)
            }

            res.json({
                pairs: CURRENCY_PAIRS,
                timeframes: TIMEFRAMES,
                available
            })
        } catch (error) {
            next(error)
        }
    }
}
