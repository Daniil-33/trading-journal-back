/**
 * Indicator Publication Repository Interface - Domain Layer
 */

import { IIndicatorPublication } from '../entities/IndicatorPublicaton'

export interface IIndicatorPublicationRepository {
    create(publication: IIndicatorPublication): Promise<IIndicatorPublication>
    findByForexFactoryEventId(eventId: string): Promise<IIndicatorPublication | null>
    findById(id: string): Promise<IIndicatorPublication | null>
    findByIndicatorId(indicatorId: string, options?: {
        limit?: number
        sortBy?: 'ts'
        sortOrder?: 'asc' | 'desc'
    }): Promise<IIndicatorPublication[]>
    findByFilters(query: any, skip?: number, limit?: number): Promise<IIndicatorPublication[]>
    findLatestByIndicatorId(indicatorId: string): Promise<IIndicatorPublication | null>
    bulkCreate(publications: IIndicatorPublication[]): Promise<IIndicatorPublication[]>
    update(id: string, publication: Partial<IIndicatorPublication>): Promise<IIndicatorPublication | null>
    delete(id: string): Promise<boolean>
}
