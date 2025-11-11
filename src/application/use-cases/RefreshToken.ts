/**
 * Refresh Token Use Case
 */

import { verifyRefreshToken, generateTokens } from '../../shared/utils/jwt'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export interface RefreshTokenResult {
    accessToken: string
    refreshToken: string
}

export class RefreshTokenUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(refreshToken: string): Promise<RefreshTokenResult> {
        try {
            // Verify refresh token
            const payload = verifyRefreshToken(refreshToken)

            // Check if user still exists
            const user = await this.userRepository.findById(payload.userId)
            if (!user) {
                throw new Error('User not found')
            }

            // Generate new tokens
            const tokens = generateTokens({
                userId: user.id!,
                email: user.email
            })

            return tokens
        } catch (error) {
            throw new Error('Invalid refresh token')
        }
    }
}
