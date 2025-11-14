/**
 * Main Router
 */

import { Router } from 'express'
import { createAuthRoutes } from './auth.routes'
import indicatorRoutes from './indicator.routes'
import candleRoutes from './candle.routes'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export function createRouter(userRepository: IUserRepository): Router {
    const router = Router()

    // Mount routes
    router.use('/auth', createAuthRoutes(userRepository))
    router.use('/indicators', indicatorRoutes)
    router.use('/candles', candleRoutes)

    // Health check
    router.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString()
        })
    })

    return router
}
