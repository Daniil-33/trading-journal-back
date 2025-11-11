/**
 * Main Router
 */

import { Router } from 'express'
import { createAuthRoutes } from './auth.routes'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export function createRouter(userRepository: IUserRepository): Router {
    const router = Router()

    // Mount routes
    router.use('/auth', createAuthRoutes(userRepository))

    // Health check
    router.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString()
        })
    })

    return router
}
