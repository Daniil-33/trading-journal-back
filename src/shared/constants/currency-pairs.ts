/**
 * Currency Pairs Constants and Mappings
 */

import { Currency } from './currencies'

// Currency pair definition
export interface CurrencyPair {
    base: Currency
    quote: Currency
    symbol: string
    name: string
}

// Major currency pairs
export const MAJOR_PAIRS: Record<string, CurrencyPair> = {
    'EUR/USD': {
        base: Currency.EUR,
        quote: Currency.USD,
        symbol: 'EURUSD',
        name: 'Euro / US Dollar'
    },
    'GBP/USD': {
        base: Currency.GBP,
        quote: Currency.USD,
        symbol: 'GBPUSD',
        name: 'British Pound / US Dollar'
    },
    'USD/JPY': {
        base: Currency.USD,
        quote: Currency.JPY,
        symbol: 'USDJPY',
        name: 'US Dollar / Japanese Yen'
    },
    'USD/CHF': {
        base: Currency.USD,
        quote: Currency.CHF,
        symbol: 'USDCHF',
        name: 'US Dollar / Swiss Franc'
    },
    'AUD/USD': {
        base: Currency.AUD,
        quote: Currency.USD,
        symbol: 'AUDUSD',
        name: 'Australian Dollar / US Dollar'
    },
    'USD/CAD': {
        base: Currency.USD,
        quote: Currency.CAD,
        symbol: 'USDCAD',
        name: 'US Dollar / Canadian Dollar'
    },
    'NZD/USD': {
        base: Currency.NZD,
        quote: Currency.USD,
        symbol: 'NZDUSD',
        name: 'New Zealand Dollar / US Dollar'
    }
}

// Cross currency pairs
export const CROSS_PAIRS: Record<string, CurrencyPair> = {
    'EUR/GBP': {
        base: Currency.EUR,
        quote: Currency.GBP,
        symbol: 'EURGBP',
        name: 'Euro / British Pound'
    },
    'EUR/JPY': {
        base: Currency.EUR,
        quote: Currency.JPY,
        symbol: 'EURJPY',
        name: 'Euro / Japanese Yen'
    },
    'EUR/CHF': {
        base: Currency.EUR,
        quote: Currency.CHF,
        symbol: 'EURCHF',
        name: 'Euro / Swiss Franc'
    },
    'EUR/AUD': {
        base: Currency.EUR,
        quote: Currency.AUD,
        symbol: 'EURAUD',
        name: 'Euro / Australian Dollar'
    },
    'EUR/CAD': {
        base: Currency.EUR,
        quote: Currency.CAD,
        symbol: 'EURCAD',
        name: 'Euro / Canadian Dollar'
    },
    'GBP/JPY': {
        base: Currency.GBP,
        quote: Currency.JPY,
        symbol: 'GBPJPY',
        name: 'British Pound / Japanese Yen'
    },
    'GBP/CHF': {
        base: Currency.GBP,
        quote: Currency.CHF,
        symbol: 'GBPCHF',
        name: 'British Pound / Swiss Franc'
    },
    'GBP/AUD': {
        base: Currency.GBP,
        quote: Currency.AUD,
        symbol: 'GBPAUD',
        name: 'British Pound / Australian Dollar'
    },
    'AUD/JPY': {
        base: Currency.AUD,
        quote: Currency.JPY,
        symbol: 'AUDJPY',
        name: 'Australian Dollar / Japanese Yen'
    },
    'CAD/JPY': {
        base: Currency.CAD,
        quote: Currency.JPY,
        symbol: 'CADJPY',
        name: 'Canadian Dollar / Japanese Yen'
    },
    'NZD/JPY': {
        base: Currency.NZD,
        quote: Currency.JPY,
        symbol: 'NZDJPY',
        name: 'New Zealand Dollar / Japanese Yen'
    }
}

// All pairs combined
export const ALL_PAIRS: Record<string, CurrencyPair> = {
    ...MAJOR_PAIRS,
    ...CROSS_PAIRS
}

/**
 * Create currency pair symbol from base and quote currencies
 */
export function createPairSymbol(base: Currency, quote: Currency): string {
    return `${base}${quote}`
}

/**
 * Create currency pair notation (e.g., "EUR/USD")
 */
export function createPairNotation(base: Currency, quote: Currency): string {
    return `${base}/${quote}`
}

/**
 * Parse currency pair notation to base and quote
 */
export function parsePairNotation(notation: string): { base: Currency; quote: Currency } | null {
    const [base, quote] = notation.split('/')
    if (!base || !quote) return null
    
    const baseUpper = base.toUpperCase() as Currency
    const quoteUpper = quote.toUpperCase() as Currency
    
    if (!Object.values(Currency).includes(baseUpper) || 
        !Object.values(Currency).includes(quoteUpper)) {
        return null
    }
    
    return { base: baseUpper, quote: quoteUpper }
}

/**
 * Get currency pair by symbol (e.g., "EURUSD")
 */
export function getPairBySymbol(symbol: string): CurrencyPair | undefined {
    return Object.values(ALL_PAIRS).find(pair => pair.symbol === symbol.toUpperCase())
}

/**
 * Get currency pair by notation (e.g., "EUR/USD")
 */
export function getPairByNotation(notation: string): CurrencyPair | undefined {
    return ALL_PAIRS[notation.toUpperCase()]
}

/**
 * Check if a currency is involved in a pair
 */
export function isCurrencyInPair(currency: Currency, pair: CurrencyPair): boolean {
    return pair.base === currency || pair.quote === currency
}

/**
 * Get all pairs involving a specific currency
 */
export function getPairsWithCurrency(currency: Currency): CurrencyPair[] {
    return Object.values(ALL_PAIRS).filter(pair => isCurrencyInPair(currency, pair))
}

/**
 * Validate if string is a valid pair notation
 */
export function isValidPairNotation(notation: string): boolean {
    return notation.toUpperCase() in ALL_PAIRS
}

/**
 * Get affected pairs by currencies
 * Returns pairs where at least one of the provided currencies is involved
 */
export function getAffectedPairs(currencies: Currency[]): CurrencyPair[] {
    const currencySet = new Set(currencies)
    return Object.values(ALL_PAIRS).filter(pair => 
        currencySet.has(pair.base) || currencySet.has(pair.quote)
    )
}
