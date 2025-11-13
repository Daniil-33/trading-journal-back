/**
 * Indicator Controller
 * Handles HTTP requests related to indicators
 */

import { Request, Response } from 'express'
import { CreateIndicator } from '../../application/use-cases/CreateIndicator'
import { GetIndicators } from '../../application/use-cases/GetIndicators'
import { GetIndicatorById } from '../../application/use-cases/GetIndicatorById'
import { ImportIndicators } from '../../application/use-cases/ImportIndicators'
import { GetIndicatorPublicationsStatistics } from '../../application/use-cases/GetIndicatorPublicationsStatistics'
import { MongoIndicatorRepository } from '../../infrastructure/repositories/MongoIndicatorRepository'
import { MongoIndicatorPublicationRepository } from '../../infrastructure/repositories/MongoIndicatorPublicationRepository'

const indicatorRepository = new MongoIndicatorRepository()
const publicationRepository = new MongoIndicatorPublicationRepository()

export class IndicatorController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const createIndicator = new CreateIndicator(indicatorRepository)
            const indicator = await createIndicator.execute(req.body)

            res.status(201).json({
                success: true,
                data: indicator
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }

    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const { country, impact, currencies } = req.query

            const filters: any = {}

            if (country) filters.country = country as string
            if (impact) filters.impact = impact as 'low' | 'medium' | 'high'
            if (currencies) {
                filters.currencies = typeof currencies === 'string' 
                    ? currencies.split(',')
                    : currencies
            }

            const getIndicators = new GetIndicators(indicatorRepository)
            const indicators = await getIndicators.execute(filters)

            res.status(200).json({
                success: true,
                data: indicators,
                count: indicators.length
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }

    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params

            const getIndicatorById = new GetIndicatorById(indicatorRepository)
            const indicator = await getIndicatorById.execute(id)

            if (!indicator) {
                res.status(404).json({
                    success: false,
                    error: 'Indicator not found'
                })
                return
            }

            res.status(200).json({
                success: true,
                data: indicator
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }

    static async getPublicationsStatistics(req: Request, res: Response): Promise<void> {
        try {
            const { indicatorId, startDate, endDate, limit, skip } = req.query

            const filter: any = {}

            if (indicatorId) filter.indicatorId = indicatorId as string
            if (startDate) filter.startDate = new Date(startDate as string)
            if (endDate) filter.endDate = new Date(endDate as string)
            if (limit) filter.limit = parseInt(limit as string, 10)
            if (skip) filter.skip = parseInt(skip as string, 10)

            const getStats = new GetIndicatorPublicationsStatistics(publicationRepository)
            const statistics = await getStats.execute(filter)

            res.status(200).json({
                success: true,
                data: statistics
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }

    static async import(req: Request, res: Response): Promise<void> {
        try {
            const { indicators } = req.body

            if (!Array.isArray(indicators) || indicators.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Request body must contain an array of indicators'
                })
                return
            }

            const importIndicators = new ImportIndicators(indicatorRepository)
            const result = await importIndicators.execute(indicators)

            res.status(200).json({
                success: true,
                data: result
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            })
        }
    }
}
