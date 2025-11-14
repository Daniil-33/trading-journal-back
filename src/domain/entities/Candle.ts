/**
 * Candle Entity - Domain Layer
 * Represents a candlestick (OHLCV) data point
 */

export interface ICandle {
    id?: string
    pair: string                    // Currency pair: "EURUSD", "GBPUSD", etc.
    timeframe: Timeframe            // Timeframe: "5m", "15m", "30m", "1h", "4h", "1d", "1w"
    timestamp: Date                 // Candle open time (GMT)
    ohlcv: [number, number, number, number, number]  // [Open, High, Low, Close, Volume]
    createdAt?: Date
    updatedAt?: Date
}

// Supported timeframes
export type Timeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'

// Supported currency pairs
export type CurrencyPair = 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'EURJPY'

// Timeframe utilities
export const TIMEFRAMES: Timeframe[] = ['5m', '15m', '30m', '1h', '4h', '1d', '1w']
export const CURRENCY_PAIRS: CurrencyPair[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY']

// Timeframe to minutes mapping
export const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '1w': 10080
}

// Helper functions for OHLCV array
export const OHLCV_INDEX = {
    OPEN: 0,
    HIGH: 1,
    LOW: 2,
    CLOSE: 3,
    VOLUME: 4
} as const

export const getOpen = (candle: ICandle): number => candle.ohlcv[OHLCV_INDEX.OPEN]
export const getHigh = (candle: ICandle): number => candle.ohlcv[OHLCV_INDEX.HIGH]
export const getLow = (candle: ICandle): number => candle.ohlcv[OHLCV_INDEX.LOW]
export const getClose = (candle: ICandle): number => candle.ohlcv[OHLCV_INDEX.CLOSE]
export const getVolume = (candle: ICandle): number => candle.ohlcv[OHLCV_INDEX.VOLUME]

