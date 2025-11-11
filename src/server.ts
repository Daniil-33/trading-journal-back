/**
 * Server Entry Point
 */

import dotenv from 'dotenv'
import { createApp } from './app'
import { connectDatabase } from './infrastructure/database/connection'
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository'

// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 3000

async function startServer() {
    try {
        // Connect to database
        await connectDatabase()

        // Create repositories
        const userRepository = new MongoUserRepository()

        // Create Express app
        const app = createApp(userRepository)

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`)
            console.log(`📍 API URL: http://localhost:${PORT}/api`)
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
