/**
 * Register User Use Case
 */

import { IUser } from '../../domain/entities/User'
import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { hashPassword } from '../../shared/utils/password'

export class RegisterUserUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(email: string, password: string): Promise<IUser> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email)
        if (existingUser) {
            throw new Error('User with this email already exists')
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create user
        const user: IUser = {
            email,
            password: hashedPassword
        }

        return await this.userRepository.create(user)
    }
}
