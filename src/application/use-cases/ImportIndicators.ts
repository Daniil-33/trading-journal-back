/**
 * Import Indicators Use Case
 * Bulk import indicators, skipping those that already exist
 */

import { IIndicator } from '../../domain/entities/Indicator'
import { IIndicatorRepository } from '../../domain/repositories/IIndicatorRepository'

export interface ImportResult {
    imported: number
    skipped: number
    errors: number
    details: {
        importedIds: string[]
        skippedForexFactoryIds: string[]
        errorMessages: string[]
    }
}

export class ImportIndicators {
    constructor(private indicatorRepository: IIndicatorRepository) {}

    async execute(indicators: Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ImportResult> {
        const result: ImportResult = {
            imported: 0,
            skipped: 0,
            errors: 0,
            details: {
                importedIds: [],
                skippedForexFactoryIds: [],
                errorMessages: []
            }
        }

        const indicatorsToImport: typeof indicators = []

        // Filter out indicators that already exist
        for (const indicator of indicators) {
            if (indicator.forexFactoryId) {
                const existing = await this.indicatorRepository.findByForexFactoryId(
                    indicator.forexFactoryId
                )
                
                if (existing) {
                    result.skipped++
                    result.details.skippedForexFactoryIds.push(indicator.forexFactoryId)
                    continue
                }
            }
            
            indicatorsToImport.push(indicator)
        }

        // Bulk import the remaining indicators
        if (indicatorsToImport.length > 0) {
            try {
                const imported = await this.indicatorRepository.bulkCreate(indicatorsToImport)
                result.imported = imported.length
                result.details.importedIds = imported
                    .filter(ind => ind.id)
                    .map(ind => ind.id!)
            } catch (error: any) {
                // Handle potential duplicate key errors from concurrent operations
                if (error.writeErrors) {
                    result.errors = error.writeErrors.length
                    result.imported = indicatorsToImport.length - error.writeErrors.length
                    
                    error.writeErrors.forEach((err: any) => {
                        result.details.errorMessages.push(err.errmsg || err.message)
                    })
                } else {
                    result.errors = indicatorsToImport.length
                    result.details.errorMessages.push(error.message)
                }
            }
        }

        return result
    }
}
