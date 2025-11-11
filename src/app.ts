/**
 * Express Application Setup
 */

import express, { Application } from 'express'
import cors from 'cors'
import { createRouter } from './presentation/routes'
import { errorHandler } from './presentation/middlewares/error.middleware'
import { IUserRepository } from './domain/repositories/IUserRepository'

export function createApp(userRepository: IUserRepository): Application {
    const app = express()

    // Middlewares
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        })
    )
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Routes
    app.use('/api', createRouter(userRepository))

    // Error handler
    app.use(errorHandler)

    return app
}
