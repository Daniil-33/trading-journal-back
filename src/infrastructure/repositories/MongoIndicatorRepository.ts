/**
 * MongoDB Indicator Repository Implementation
 */

import { IIndicator } from '../../domain/entities/Indicator'
import { IIndicatorRepository } from '../../domain/repositories/IIndicatorRepository'
import { IndicatorModel } from '../database/models/IndicatorModel'

export class MongoIndicatorRepository implements IIndicatorRepository {
    async create(indicator: IIndicator): Promise<IIndicator> {
        const createdIndicator = await IndicatorModel.create(indicator)
        return this.mapToEntity(createdIndicator)
    }

    async findByForexFactoryId(forexFactoryId: string): Promise<IIndicator | null> {
        const indicator = await IndicatorModel.findOne({ forexFactoryId })
        return indicator ? this.mapToEntity(indicator) : null
    }

    async findById(id: string): Promise<IIndicator | null> {
        const indicator = await IndicatorModel.findById(id)
        return indicator ? this.mapToEntity(indicator) : null
    }

    async findAll(filters?: {
        country?: string
        impact?: 'low' | 'medium' | 'high'
        currencies?: string[]
    }): Promise<IIndicator[]> {
        const query: any = {}
        
        if (filters?.country) {
            query.country = filters.country
        }
        
        if (filters?.impact) {
            query.impact = filters.impact
        }
        
        if (filters?.currencies && filters.currencies.length > 0) {
            query.affectedCurrencies = { $in: filters.currencies }
        }
        
        const indicators = await IndicatorModel.find(query)
        return indicators.map(indicator => this.mapToEntity(indicator))
    }

    async bulkCreate(indicators: IIndicator[]): Promise<IIndicator[]> {
        const createdIndicators = await IndicatorModel.insertMany(indicators, { 
            ordered: false 
        })
        return createdIndicators.map(indicator => this.mapToEntity(indicator))
    }

    async update(id: string, indicatorData: Partial<IIndicator>): Promise<IIndicator | null> {
        const indicator = await IndicatorModel.findByIdAndUpdate(id, indicatorData, {
            new: true
        })
        return indicator ? this.mapToEntity(indicator) : null
    }

    async delete(id: string): Promise<boolean> {
        const result = await IndicatorModel.findByIdAndDelete(id)
        return result !== null
    }

    private mapToEntity(doc: any): IIndicator {
        return {
            id: doc._id.toString(),
            name: doc.name,
            country: doc.country,
            impact: doc.impact,
            frequency: doc.frequency,
            publishingTime: doc.publishingTime,
            affectedCurrencies: doc.affectedCurrencies,
            title: doc.title,
            description: doc.description,
            forexFactoryId: doc.forexFactoryId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }
    }
}
