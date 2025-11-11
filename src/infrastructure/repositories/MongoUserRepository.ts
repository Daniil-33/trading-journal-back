/**
 * MongoDB User Repository Implementation
 */

import { IUser } from '../../domain/entities/User'
import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { UserModel } from '../database/models/UserModel'

export class MongoUserRepository implements IUserRepository {
    async create(user: IUser): Promise<IUser> {
        const createdUser = await UserModel.create(user)
        return this.mapToEntity(createdUser)
    }

    async findByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ email })
        return user ? this.mapToEntity(user) : null
    }

    async findById(id: string): Promise<IUser | null> {
        const user = await UserModel.findById(id)
        return user ? this.mapToEntity(user) : null
    }

    async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        const user = await UserModel.findByIdAndUpdate(id, userData, {
            new: true
        })
        return user ? this.mapToEntity(user) : null
    }

    async delete(id: string): Promise<boolean> {
        const result = await UserModel.findByIdAndDelete(id)
        return result !== null
    }

    private mapToEntity(doc: any): IUser {
        return {
            id: doc._id.toString(),
            email: doc.email,
            password: doc.password,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }
    }
}
