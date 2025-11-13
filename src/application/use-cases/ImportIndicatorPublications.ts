/**
 * Import Indicator Publications Use Case
 * Bulk import publications, skipping those that already exist
 */

import { IIndicatorPublication } from '../../domain/entities/IndicatorPublicaton'
import { IIndicatorPublicationRepository } from '../../domain/repositories/IIndicatorPublicationRepository'

export interface ImportPublicationsResult {
    imported: number
    skipped: number
    errors: number
    details: {
        importedIds: string[]
        skippedEventIds: string[]
        errorMessages: string[]
    }
}

export class ImportIndicatorPublications {
    constructor(private publicationRepository: IIndicatorPublicationRepository) {}

    async execute(publications: Omit<IIndicatorPublication, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ImportPublicationsResult> {
        const result: ImportPublicationsResult = {
            imported: 0,
            skipped: 0,
            errors: 0,
            details: {
                importedIds: [],
                skippedEventIds: [],
                errorMessages: []
            }
        }

        const publicationsToImport: typeof publications = []

        // Filter out publications that already exist
        for (const publication of publications) {
            if (publication.forexFactoryEventId) {
                const existing = await this.publicationRepository.findByForexFactoryEventId(
                    publication.forexFactoryEventId
                )
                
                if (existing) {
                    result.skipped++
                    result.details.skippedEventIds.push(publication.forexFactoryEventId)
                    continue
                }
            }
            
            publicationsToImport.push(publication)
        }

        // Bulk import the remaining publications
        if (publicationsToImport.length > 0) {
            try {
                const imported = await this.publicationRepository.bulkCreate(publicationsToImport)
                result.imported = imported.length
                result.details.importedIds = imported
                    .filter(pub => pub.id)
                    .map(pub => pub.id!)
            } catch (error: any) {
                // Handle potential duplicate key errors from concurrent operations
                if (error.writeErrors) {
                    result.errors = error.writeErrors.length
                    result.imported = publicationsToImport.length - error.writeErrors.length
                    
                    error.writeErrors.forEach((err: any) => {
                        result.details.errorMessages.push(err.errmsg || err.message)
                    })
                } else {
                    result.errors = publicationsToImport.length
                    result.details.errorMessages.push(error.message)
                }
            }
        }

        return result
    }
}
