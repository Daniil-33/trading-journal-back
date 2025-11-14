/**
 * Mongo Candle Repository - Infrastructure Layer
 */

import mongoose from 'mongoose'
import { ICandleRepository, CandleQueryOptions } from '../../domain/repositories/ICandleRepository'
import { ICandle, Timeframe } from '../../domain/entities/Candle'
import { CandleModel, ICandleDocument } from '../database/models/CandleModel'

export class MongoCandleRepository implements ICandleRepository {
    async create(candle: ICandle): Promise<ICandle> {
        const created = await CandleModel.create(candle)
        return this.mapToEntity(created)
    }

    async bulkCreate(candles: ICandle[]): Promise<number> {
        try {
            // Use insertMany with ordered: false to continue on duplicates
            const result = await CandleModel.insertMany(candles, {
                ordered: false,
                rawResult: true
            })
            return result.insertedCount || 0
        } catch (error: any) {
            // If it's a bulk write error, some documents may have been inserted
            if (error.code === 11000 || error.name === 'MongoBulkWriteError') {
                return error.result?.nInserted || 0
            }
            throw error
        }
    }

    async findByQuery(options: CandleQueryOptions): Promise<ICandle[]> {
        const query: any = {
            pair: options.pair,
            timeframe: options.timeframe
        }

        if (options.from || options.to) {
            query.timestamp = {}
            if (options.from) query.timestamp.$gte = options.from
            if (options.to) query.timestamp.$lte = options.to
        }

        let dbQuery = CandleModel.find(query).sort({ timestamp: -1 })

        if (options.skip) {
            dbQuery = dbQuery.skip(options.skip)
        }

        if (options.limit) {
            dbQuery = dbQuery.limit(options.limit)
        }

        const candles = await dbQuery.exec()
        return candles.map(c => this.mapToEntity(c))
    }

    async findLatest(pair: string, timeframe: Timeframe, limit: number = 1): Promise<ICandle[]> {
        const candles = await CandleModel
            .find({ pair, timeframe })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec()

        return candles.map(c => this.mapToEntity(c))
    }

    async findByTimestamp(pair: string, timeframe: Timeframe, timestamp: Date): Promise<ICandle | null> {
        const candle = await CandleModel.findOne({ pair, timeframe, timestamp })
        return candle ? this.mapToEntity(candle) : null
    }

    async count(pair: string, timeframe: Timeframe): Promise<number> {
        return await CandleModel.countDocuments({ pair, timeframe })
    }

    async deleteAll(): Promise<number> {
        const result = await CandleModel.deleteMany({})
        return result.deletedCount || 0
    }

    async getAvailableDataInfo(): Promise<{
        pair: string
        timeframe: Timeframe
        count: number
        oldest: Date | null
        newest: Date | null
    }[]> {
        const result = await CandleModel.aggregate([
            {
                $group: {
                    _id: { pair: '$pair', timeframe: '$timeframe' },
                    count: { $sum: 1 },
                    oldest: { $min: '$timestamp' },
                    newest: { $max: '$timestamp' }
                }
            },
            {
                $sort: { '_id.pair': 1, '_id.timeframe': 1 }
            }
        ])

        return result.map(r => ({
            pair: r._id.pair,
            timeframe: r._id.timeframe,
            count: r.count,
            oldest: r.oldest,
            newest: r.newest
        }))
    }

    private mapToEntity(doc: ICandleDocument): ICandle {
        return {
            id: doc.id,
            pair: doc.pair,
            timeframe: doc.timeframe,
            timestamp: doc.timestamp,
            ohlcv: doc.ohlcv,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }
    }
}
