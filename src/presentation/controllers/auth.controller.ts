/**
 * Auth Controller
 */

import { Request, Response } from 'express'
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUser'
import { LoginUserUseCase } from '../../application/use-cases/LoginUser'
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshToken'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export class AuthController {
    private registerUserUseCase: RegisterUserUseCase
    private loginUserUseCase: LoginUserUseCase
    private refreshTokenUseCase: RefreshTokenUseCase

    constructor(userRepository: IUserRepository) {
        this.registerUserUseCase = new RegisterUserUseCase(userRepository)
        this.loginUserUseCase = new LoginUserUseCase(userRepository)
        this.refreshTokenUseCase = new RefreshTokenUseCase(userRepository)
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                res.status(400).json({
                    error: 'Email and password are required'
                })
                return
            }

            const user = await this.registerUserUseCase.execute(
                email,
                password
            )

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email
                }
            })
        } catch (error: any) {
            res.status(400).json({ error: error.message })
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                res.status(400).json({
                    error: 'Email and password are required'
                })
                return
            }

            const result = await this.loginUserUseCase.execute(email, password)

            res.status(200).json({
                message: 'Login successful',
                user: result.user,
                tokens: result.tokens
            })
        } catch (error: any) {
            res.status(401).json({ error: error.message })
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                res.status(400).json({ error: 'Refresh token is required' })
                return
            }

            const tokens =
                await this.refreshTokenUseCase.execute(refreshToken)

            res.status(200).json({
                message: 'Tokens refreshed successfully',
                tokens
            })
        } catch (error: any) {
            res.status(401).json({ error: error.message })
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            // @ts-ignore
            const userId = req.user?.userId

            res.status(200).json({
                message: 'Profile retrieved successfully',
                // @ts-ignore
                user: req.user
            })
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }
}
