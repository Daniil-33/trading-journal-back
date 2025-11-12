/**
 * Indicator Repository Interface - Domain Layer
 * Defines the contract for indicator data operations
 */

import { IIndicator } from '../entities/Indicator'

export interface IIndicatorRepository {
    create(indicator: IIndicator): Promise<IIndicator>
    findByForexFactoryId(forexFactoryId: string): Promise<IIndicator | null>
    findById(id: string): Promise<IIndicator | null>
    findAll(filters?: {
        country?: string
        impact?: 'low' | 'medium' | 'high'
        currencies?: string[]
    }): Promise<IIndicator[]>
    bulkCreate(indicators: IIndicator[]): Promise<IIndicator[]>
    update(id: string, indicator: Partial<IIndicator>): Promise<IIndicator | null>
    delete(id: string): Promise<boolean>
}
