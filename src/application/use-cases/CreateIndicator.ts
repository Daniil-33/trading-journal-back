/**
 * Create Indicator Use Case
 */

import { IIndicator } from '../../domain/entities/Indicator'
import { IIndicatorRepository } from '../../domain/repositories/IIndicatorRepository'

export class CreateIndicator {
    constructor(private indicatorRepository: IIndicatorRepository) {}

    async execute(indicatorData: Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'>): Promise<IIndicator> {
        // Check if indicator with forexFactoryId already exists
        if (indicatorData.forexFactoryId) {
            const existing = await this.indicatorRepository.findByForexFactoryId(
                indicatorData.forexFactoryId
            )
            if (existing) {
                throw new Error(`Indicator with forexFactoryId ${indicatorData.forexFactoryId} already exists`)
            }
        }

        return await this.indicatorRepository.create(indicatorData)
    }
}
