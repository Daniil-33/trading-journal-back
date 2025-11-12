/**
 * Get Indicators Use Case
 */

import { IIndicator } from '../../domain/entities/Indicator'
import { IIndicatorRepository } from '../../domain/repositories/IIndicatorRepository'

export class GetIndicators {
    constructor(private indicatorRepository: IIndicatorRepository) {}

    async execute(filters?: {
        country?: string
        impact?: 'low' | 'medium' | 'high'
        currencies?: string[]
    }): Promise<IIndicator[]> {
        return await this.indicatorRepository.findAll(filters)
    }
}
