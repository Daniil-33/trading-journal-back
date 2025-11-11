/**
 * MongoDB Connection
 */

import mongoose from 'mongoose'

/**
 * Build MongoDB connection URI from environment variables
 */
export function buildMongoUri(): string {
    const {
        MONGODB_URI,
        MONGODB_USER,
        MONGODB_PASSWORD,
        MONGODB_HOST,
        MONGODB_PORT,
        MONGODB_DATABASE
    } = process.env

    // If full URI is provided, use it
    if (MONGODB_URI) {
        return MONGODB_URI
    }

    // Otherwise build from components
    const host = MONGODB_HOST || 'localhost'
    const port = MONGODB_PORT || '27017'
    const database = MONGODB_DATABASE || 'macro-analytics'

    if (MONGODB_USER && MONGODB_PASSWORD) {
        return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${host}:${port}/${database}`
    }

    return `mongodb://${host}:${port}/${database}`
}

export async function connectDatabase(uri?: string): Promise<void> {
    try {
        const connectionUri = uri || buildMongoUri()
        await mongoose.connect(connectionUri)
        console.log('✅ MongoDB connected successfully')
    } catch (error) {
        console.error('❌ MongoDB connection error:', error)
        process.exit(1)
    }
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
}
