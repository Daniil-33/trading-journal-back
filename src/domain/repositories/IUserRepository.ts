/**
 * User Repository Interface - Domain Layer
 * Defines the contract for user data operations
 */

import { IUser } from '../entities/User'

export interface IUserRepository {
    create(user: IUser): Promise<IUser>
    findByEmail(email: string): Promise<IUser | null>
    findById(id: string): Promise<IUser | null>
    update(id: string, user: Partial<IUser>): Promise<IUser | null>
    delete(id: string): Promise<boolean>
}
