/**
 * Indicator Controller
 * Handles HTTP requests related to indicators
 */

import { Request, Response } from 'express'
import { CreateIndicator } from '../../application/use-cases/CreateIndicator'
import { GetIndicators } from '../../application/use-cases/GetIndicators'
import { ImportIndicators } from '../../application/use-cases/ImportIndicators'
import { MongoIndicatorRepository } from '../../infrastructure/repositories/MongoIndicatorRepository'

const indicatorRepository = new MongoIndicatorRepository()

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
