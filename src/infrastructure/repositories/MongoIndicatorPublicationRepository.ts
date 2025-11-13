/**
 * MongoDB Indicator Publication Repository Implementation
 */

import mongoose from 'mongoose'
import { IIndicatorPublication } from '../../domain/entities/IndicatorPublicaton'
import { IIndicatorPublicationRepository } from '../../domain/repositories/IIndicatorPublicationRepository'
import { IndicatorPublicationModel } from '../database/models/IndicatorPublicationModel'

export class MongoIndicatorPublicationRepository implements IIndicatorPublicationRepository {
    async create(publication: IIndicatorPublication): Promise<IIndicatorPublication> {
        const created = await IndicatorPublicationModel.create(publication)
        return this.mapToEntity(created)
    }

    async findByForexFactoryEventId(eventId: string): Promise<IIndicatorPublication | null> {
        const publication = await IndicatorPublicationModel.findOne({ forexFactoryEventId: eventId })
        return publication ? this.mapToEntity(publication) : null
    }

    async findById(id: string): Promise<IIndicatorPublication | null> {
        const publication = await IndicatorPublicationModel.findById(id)
        return publication ? this.mapToEntity(publication) : null
    }

    async findByIndicatorId(indicatorId: string, options?: {
        limit?: number
        sortBy?: 'ts'
        sortOrder?: 'asc' | 'desc'
    }): Promise<IIndicatorPublication[]> {
        let query = IndicatorPublicationModel.find({
            indicatorId: new mongoose.Types.ObjectId(indicatorId)
        })

        if (options?.sortBy) {
            const sortOrder = options.sortOrder === 'asc' ? 1 : -1
            query = query.sort({ [options.sortBy]: sortOrder })
        }

        if (options?.limit) {
            query = query.limit(options.limit)
        }

        const publications = await query.exec()
        return publications.map(pub => this.mapToEntity(pub))
    }

    async findByFilters(queryFilters: any, skip: number = 0, limit: number = 100): Promise<IIndicatorPublication[]> {
        const publications = await IndicatorPublicationModel
            .find(queryFilters)
            .sort({ ts: -1 })
            .skip(skip)
            .limit(limit)
            .exec()

        return publications.map(pub => this.mapToEntity(pub))
    }

    async findLatestByIndicatorId(indicatorId: string): Promise<IIndicatorPublication | null> {        const publication = await IndicatorPublicationModel.findOne({
            indicatorId: new mongoose.Types.ObjectId(indicatorId)
        }).sort({ ts: -1 })

        return publication ? this.mapToEntity(publication) : null
    }

    async bulkCreate(publications: IIndicatorPublication[]): Promise<IIndicatorPublication[]> {
        const created = await IndicatorPublicationModel.insertMany(publications, {
            ordered: false
        })
        return created.map(pub => this.mapToEntity(pub))
    }

    async update(id: string, publicationData: Partial<IIndicatorPublication>): Promise<IIndicatorPublication | null> {
        const publication = await IndicatorPublicationModel.findByIdAndUpdate(
            id, 
            publicationData, 
            { new: true }
        )
        return publication ? this.mapToEntity(publication) : null
    }

    async delete(id: string): Promise<boolean> {
        const result = await IndicatorPublicationModel.findByIdAndDelete(id)
        return result !== null
    }

    private mapToEntity(doc: any): IIndicatorPublication {
        return {
            id: doc._id.toString(),
            indicatorId: doc.indicatorId.toString(),
            forexFactoryEventId: doc.forexFactoryEventId,
            ts: doc.ts,
            actual: doc.actual,
            forecast: doc.forecast,
            previous: doc.previous,
            revision: doc.revision,
            isActive: doc.isActive,
            isMostRecent: doc.isMostRecent,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }
    }
}
