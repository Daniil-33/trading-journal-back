/**
 * MongoDB Indicator Publication Model
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IIndicatorPublicationDocument extends Document {
    indicatorId: mongoose.Types.ObjectId
    forexFactoryEventId: string
    ts: Date
    actual: number | string | null
    forecast: number | string | null
    previous: number | string | null
    revision: number | string | null
    isActive: boolean
    isMostRecent: boolean
    createdAt: Date
    updatedAt: Date
}

const IndicatorPublicationSchema = new Schema<IIndicatorPublicationDocument>(
    {
        indicatorId: {
            type: Schema.Types.ObjectId,
            ref: 'Indicator',
            required: true
        },
        forexFactoryEventId: {
            type: String,
            required: true,
            unique: true
        },
        ts: {
            type: Date,
            required: true
        },
        actual: {
            type: Schema.Types.Mixed,
            default: null
        },
        forecast: {
            type: Schema.Types.Mixed,
            default: null
        },
        previous: {
            type: Schema.Types.Mixed,
            default: null
        },
        revision: {
            type: Schema.Types.Mixed,
            default: null
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isMostRecent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

// Indexes for performance
IndicatorPublicationSchema.index({ indicatorId: 1, ts: -1 })
IndicatorPublicationSchema.index({ forexFactoryEventId: 1 })
IndicatorPublicationSchema.index({ ts: -1 })
IndicatorPublicationSchema.index({ isMostRecent: 1 })

export const IndicatorPublicationModel = mongoose.model<IIndicatorPublicationDocument>(
    'IndicatorPublication', 
    IndicatorPublicationSchema
)
