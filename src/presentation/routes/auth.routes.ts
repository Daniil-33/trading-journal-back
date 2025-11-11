/**
 * Auth Routes
 */

import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export function createAuthRoutes(
    userRepository: IUserRepository
): Router {
    const router = Router()
    const authController = new AuthController(userRepository)

    // Public routes
    router.post('/register', (req, res) => authController.register(req, res))
    router.post('/login', (req, res) => authController.login(req, res))
    router.post('/refresh', (req, res) =>
        authController.refreshToken(req, res)
    )

    // Protected routes
    router.get('/profile', authMiddleware, (req, res) =>
        authController.getProfile(req, res)
    )

    return router
}
