/**
 * Currency Constants for JavaScript/Node.js
 * Use this in plain JS files like the Forex Factory scraper
 */

// Forex Factory Currency IDs
const FOREX_FACTORY_CURRENCY_IDS = {
    EUR: 5,
    GBP: 6,
    JPY: 7,
    CHF: 8,
    USD: 9,
    AUD: 10,
    CAD: 11,
    NZD: 12
}

// Currency full names
const CURRENCY_NAMES = {
    EUR: 'Euro',
    USD: 'US Dollar',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    CHF: 'Swiss Franc',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    NZD: 'New Zealand Dollar'
}

module.exports = {
    FOREX_FACTORY_CURRENCY_IDS,
    CURRENCY_NAMES
}
