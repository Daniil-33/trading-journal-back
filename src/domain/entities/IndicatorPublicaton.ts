/**
 * Indicator Publication Entity - Domain Model
 * Represents a specific publication/release of an economic indicator
 */

export interface IIndicatorPublication {
    id?: string
    indicatorId: string
    forexFactoryEventId: string
    ts: Date
    actual: number | string | null
    forecast: number | string | null
    previous: number | string | null
    revision: number | string | null
    isActive?: boolean
    isMostRecent?: boolean
    createdAt?: Date
    updatedAt?: Date
}

export class IndicatorPublication {
    constructor(
        public readonly indicatorId: string,
        public readonly forexFactoryEventId: string,
        public readonly ts: Date,
        public readonly actual: number | string | null,
        public readonly forecast: number | string | null,
        public readonly previous: number | string | null,
        public readonly revision: number | string | null,
        public readonly isActive?: boolean,
        public readonly isMostRecent?: boolean,
        public readonly id?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) {}

    static create(data: Omit<IIndicatorPublication, 'id' | 'createdAt' | 'updatedAt'>): IndicatorPublication {
        return new IndicatorPublication(
            data.indicatorId,
            data.forexFactoryEventId,
            data.ts,
            data.actual,
            data.forecast,
            data.previous,
            data.revision,
            data.isActive,
            data.isMostRecent
        )
    }
}
