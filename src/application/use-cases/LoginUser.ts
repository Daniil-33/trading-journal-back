/**
 * Login User Use Case
 */

import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { comparePassword } from '../../shared/utils/password'
import { generateTokens } from '../../shared/utils/jwt'

export interface LoginResult {
    user: {
        id: string
        email: string
    }
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export class LoginUserUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(email: string, password: string): Promise<LoginResult> {
        // Find user
        const user = await this.userRepository.findByEmail(email)
        if (!user) {
            throw new Error('Invalid credentials')
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            throw new Error('Invalid credentials')
        }

        // Generate tokens
        const tokens = generateTokens({ userId: user.id!, email: user.email })

        return {
            user: {
                id: user.id!,
                email: user.email
            },
            tokens
        }
    }
}
