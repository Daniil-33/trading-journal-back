/**
 * Candle MongoDB Schema
 */

import mongoose, { Schema, Document } from 'mongoose'
import { ICandle, TIMEFRAMES, CURRENCY_PAIRS } from '../../../domain/entities/Candle'

export interface ICandleDocument extends Omit<ICandle, 'id'>, Document {}

const CandleSchema = new Schema<ICandleDocument>(
    {
        pair: {
            type: String,
            required: true,
            enum: CURRENCY_PAIRS,
            index: true
        },
        timeframe: {
            type: String,
            required: true,
            enum: TIMEFRAMES,
            index: true
        },
        timestamp: {
            type: Date,
            required: true,
            index: true
        },
        ohlcv: {
            type: [Number],
            required: true,
            validate: {
                validator: (v: number[]) => Array.isArray(v) && v.length === 5,
                message: 'OHLCV must be an array of 5 numbers: [Open, High, Low, Close, Volume]'
            }
        }
    },
    {
        timestamps: true,
        collection: 'candles',
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = (ret._id as mongoose.Types.ObjectId).toHexString()
                delete ret._id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (ret as any).__v
                return ret
            }
        }
    }
)

// Compound index for efficient queries: by pair + timeframe + time range
CandleSchema.index({ pair: 1, timeframe: 1, timestamp: -1 })

// Unique constraint: one candle per pair-timeframe-timestamp
CandleSchema.index({ pair: 1, timeframe: 1, timestamp: 1 }, { unique: true })

export const CandleModel = mongoose.model<ICandleDocument>('Candle', CandleSchema)

