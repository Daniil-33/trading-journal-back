/**
 * Indicator Entity - Domain Model
 */

export interface IndicatorSpec {
    order: number
    title: string
    html: string
}

export interface IIndicator {
    id?: string
    name: string
    country: string
    impact: 'low' | 'medium' | 'high'
    frequency: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | null
    publishingTime: 'certain' | 'uncertain'
    affectedCurrencies: string[]
    affectedPairs: string[]
    title: string
    info: IndicatorSpec[]
    forexFactoryId?: string
    createdAt?: Date
    updatedAt?: Date
}

export class Indicator {
    constructor(
        public readonly name: string,
        public readonly country: string,
        public readonly impact: 'low' | 'medium' | 'high',
        public readonly frequency: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | null,
        public readonly publishingTime: 'certain' | 'uncertain',
        public readonly affectedCurrencies: string[],
        public readonly affectedPairs: string[],
        public readonly title: string,
        public readonly info: IndicatorSpec[],
        public readonly id?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    static create(data: Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'>): Indicator {
        return new Indicator(
            data.name,
            data.country,
            data.impact,
            data.frequency,
            data.publishingTime,
            data.affectedCurrencies,
            data.affectedPairs,
            data.title,
            data.info
        )
    }
}

