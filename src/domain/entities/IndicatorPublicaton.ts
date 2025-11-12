/**
 * Indicator Publication Entity - Domain Model
 */

// export interface IIndicator {
//     id?: string
//     name: string
//     country: string
//     impact: 'low' | 'medium' | 'high'
//     frequency: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | null
//     publishingTime: 'certain' | 'uncertain'
//     affectedCurrencies: string[]
//     title: string
//     description: string
//     createdAt?: Date
//     updatedAt?: Date
// }

export interface IIndicatorPublication {
    id?: string
    indicator: string
    ts: Date
    actual: number | string | null
    forecast: number | string | null
    previous: number | string | null
    revision: number | string | null
    createdAt?: Date
    updatedAt?: Date
}

export class IndicatorPublication {
    constructor(
        public readonly indicator: string,
        public readonly ts: Date,
        public readonly actual: number | string | null,
        public readonly forecast: number | string | null,
        public readonly previous: number | string | null,
        public readonly revision: number | string | null,
        public readonly id?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    static create(data: Omit<IIndicatorPublication, 'id' | 'createdAt' | 'updatedAt'>): IndicatorPublication {
        return new IndicatorPublication(
            data.indicator,
            data.ts,
            data.actual,
            data.forecast,
            data.previous,
            data.revision
        )
    }
}

