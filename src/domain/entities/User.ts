/**
 * User Entity - Domain Model
 */

export interface IUser {
    id?: string
    email: string
    password: string
    createdAt?: Date
    updatedAt?: Date
}

export class User {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly id?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    static create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): User {
        return new User(data.email, data.password)
    }
}
