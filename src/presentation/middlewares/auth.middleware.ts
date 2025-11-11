/**
 * Auth Middleware - JWT verification
 */

import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../../shared/utils/jwt'

export interface AuthRequest extends Request {
    user?: {
        userId: string
        email: string
    }
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' })
            return
        }

        const token = authHeader.substring(7)
        const decoded = verifyAccessToken(token)

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        }

        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
