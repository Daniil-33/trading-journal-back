/**
 * Currency Constants and Mappings
 */

// Major currencies
export enum Currency {
    EUR = 'EUR',
    USD = 'USD',
    GBP = 'GBP',
    JPY = 'JPY',
    CHF = 'CHF',
    AUD = 'AUD',
    CAD = 'CAD',
    NZD = 'NZD'
}

// Forex Factory Currency IDs
export const FOREX_FACTORY_CURRENCY_IDS: Record<Currency, number> = {
    [Currency.EUR]: 5,
    [Currency.GBP]: 6,
    [Currency.JPY]: 7,
    [Currency.CHF]: 8,
    [Currency.USD]: 9,
    [Currency.AUD]: 10,
    [Currency.CAD]: 11,
    [Currency.NZD]: 12
}

// Reverse mapping: ID to Currency
export const FOREX_FACTORY_ID_TO_CURRENCY: Record<number, Currency> = Object.entries(
    FOREX_FACTORY_CURRENCY_IDS
).reduce((acc, [currency, id]) => {
    acc[id] = currency as Currency
    return acc
}, {} as Record<number, Currency>)

// Currency full names
export const CURRENCY_NAMES: Record<Currency, string> = {
    [Currency.EUR]: 'Euro',
    [Currency.USD]: 'US Dollar',
    [Currency.GBP]: 'British Pound',
    [Currency.JPY]: 'Japanese Yen',
    [Currency.CHF]: 'Swiss Franc',
    [Currency.AUD]: 'Australian Dollar',
    [Currency.CAD]: 'Canadian Dollar',
    [Currency.NZD]: 'New Zealand Dollar'
}

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    [Currency.EUR]: '€',
    [Currency.USD]: '$',
    [Currency.GBP]: '£',
    [Currency.JPY]: '¥',
    [Currency.CHF]: 'CHF',
    [Currency.AUD]: 'A$',
    [Currency.CAD]: 'C$',
    [Currency.NZD]: 'NZ$'
}

// Country to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
    'US': Currency.USD,
    'EU': Currency.EUR,
    'EZ': Currency.EUR, // Eurozone
    'UK': Currency.GBP,
    'GB': Currency.GBP,
    'JP': Currency.JPY,
    'CH': Currency.CHF,
    'AU': Currency.AUD,
    'CA': Currency.CAD,
    'NZ': Currency.NZD
}

/**
 * Get currency by country code
 */
export function getCurrencyByCountry(countryCode: string): Currency | undefined {
    return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()]
}

/**
 * Get Forex Factory ID for currency
 */
export function getForexFactoryId(currency: Currency): number | undefined {
    return FOREX_FACTORY_CURRENCY_IDS[currency]
}

/**
 * Get currency by Forex Factory ID
 */
export function getCurrencyByForexFactoryId(id: number): Currency | undefined {
    return FOREX_FACTORY_ID_TO_CURRENCY[id]
}

/**
 * Validate if string is a valid currency code
 */
export function isValidCurrency(code: string): code is Currency {
    return Object.values(Currency).includes(code as Currency)
}
