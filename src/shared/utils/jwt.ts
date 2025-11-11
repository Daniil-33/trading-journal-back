/**
 * JWT utilities
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface TokenPayload {
    userId: string
    email: string
}

export interface DecodedToken extends TokenPayload {
    iat: number
    exp: number
}

export function generateTokens(payload: TokenPayload): {
    accessToken: string
    refreshToken: string
} {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as string
    })

    const refreshToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN as string
    })

    return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): DecodedToken {
    return jwt.verify(token, JWT_SECRET) as DecodedToken
}

export function verifyRefreshToken(token: string): DecodedToken {
    return jwt.verify(token, JWT_SECRET) as DecodedToken
}
