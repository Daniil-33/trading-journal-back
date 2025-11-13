/**
 * Get Indicator Publications Statistics Use Case
 * Retrieves publication statistics for an indicator within a time range
 */

import { IIndicatorPublicationRepository } from '../../domain/repositories/IIndicatorPublicationRepository'
import { IIndicatorPublication } from '../../domain/entities/IndicatorPublicaton'

export interface PublicationsFilter {
  indicatorId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  skip?: number
}

export interface PublicationStatistics {
  total: number
  withActual: number
  withForecast: number
  withRevision: number
  dateRange: {
    oldest: Date | null
    newest: Date | null
  }
  publications: IIndicatorPublication[]
}

export class GetIndicatorPublicationsStatistics {
  constructor(private publicationRepository: IIndicatorPublicationRepository) {}

  async execute(filter: PublicationsFilter): Promise<PublicationStatistics> {
    // Build query
    const query: any = {}
    
    if (filter.indicatorId) {
      query.indicatorId = filter.indicatorId
    }
    
    if (filter.startDate || filter.endDate) {
      query.ts = {}
      if (filter.startDate) {
        query.ts.$gte = filter.startDate
      }
      if (filter.endDate) {
        query.ts.$lte = filter.endDate
      }
    }

    // Get publications with pagination
    const publications = await this.publicationRepository.findByFilters(
      query,
      filter.skip || 0,
      filter.limit || 100
    )

    // Calculate statistics
    const total = publications.length
    const withActual = publications.filter((p: IIndicatorPublication) => p.actual !== null && p.actual !== undefined).length
    const withForecast = publications.filter((p: IIndicatorPublication) => p.forecast !== null && p.forecast !== undefined).length
    const withRevision = publications.filter((p: IIndicatorPublication) => p.revision !== null && p.revision !== undefined && p.revision !== '').length

    // Get date range
    let oldest: Date | null = null
    let newest: Date | null = null

    if (publications.length > 0) {
      const dates = publications.map((p: IIndicatorPublication) => p.ts).filter((d: Date) => d instanceof Date)
      if (dates.length > 0) {
        oldest = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
        newest = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
      }
    }

    return {
      total,
      withActual,
      withForecast,
      withRevision,
      dateRange: {
        oldest,
        newest
      },
      publications
    }
  }
}
