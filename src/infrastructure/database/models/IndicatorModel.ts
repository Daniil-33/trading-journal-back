/**
 * MongoDB Indicator Model
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IIndicatorDocument extends Document {
    name: string
    country: string
    impact: 'low' | 'medium' | 'high'
    frequency: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | null
    publishingTime: 'certain' | 'uncertain'
    affectedCurrencies: string[]
    affectedPairs: string[]
    title: string
    info: Array<{
        order: number
        title: string
        html: string
    }>
    forexFactoryId?: string
    createdAt: Date
    updatedAt: Date
}

const IndicatorSchema = new Schema<IIndicatorDocument>(
    {
        name: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        impact: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true
        },
        frequency: {
            type: String,
            enum: ['annual', 'quarterly', 'monthly', 'weekly', 'daily', null],
            default: null
        },
        publishingTime: {
            type: String,
            enum: ['certain', 'uncertain'],
            required: true
        },
        affectedCurrencies: {
            type: [String],
            required: true,
            default: []
        },
        affectedPairs: {
            type: [String],
            required: true,
            default: []
        },
        title: {
            type: String,
            required: true
        },
        info: {
            type: [{
                order: Number,
                title: String,
                html: String
            }],
            required: true,
            default: []
        },
        forexFactoryId: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    {
        timestamps: true
    }
)

// Create index for faster queries
IndicatorSchema.index({ country: 1 })
IndicatorSchema.index({ impact: 1 })
IndicatorSchema.index({ affectedCurrencies: 1 })
IndicatorSchema.index({ forexFactoryId: 1 })

export const IndicatorModel = mongoose.model<IIndicatorDocument>('Indicator', IndicatorSchema)
