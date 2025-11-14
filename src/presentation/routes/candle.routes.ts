/**
 * Candle Routes
 */

import { Router } from 'express'
import { CandleController } from '../controllers/candle.controller'

const router = Router()
const controller = new CandleController()

/**
 * GET /api/candles/statistics
 * Get overall statistics about available candle data
 */
router.get('/statistics', (req, res, next) => controller.getStatistics(req, res, next))

/**
 * GET /api/candles/pairs
 * Get list of available pairs and timeframes
 */
router.get('/pairs', (req, res, next) => controller.getAvailablePairs(req, res, next))

/**
 * GET /api/candles/:pair/:timeframe/latest
 * Get latest N candles for a pair/timeframe
 * Query params:
 *   - limit: number of candles (default: 100, max: 10000)
 */
router.get('/:pair/:timeframe/latest', (req, res, next) => controller.getLatest(req, res, next))

/**
 * GET /api/candles/:pair/:timeframe/count
 * Get total count of candles for a pair/timeframe
 */
router.get('/:pair/:timeframe/count', (req, res, next) => controller.getCount(req, res, next))

/**
 * GET /api/candles/:pair/:timeframe
 * Get candles for a pair/timeframe with filters
 * Query params:
 *   - from: ISO date string (start date)
 *   - to: ISO date string (end date)
 *   - limit: number of candles (default: 1000, max: 10000)
 *   - skip: number of candles to skip
 */
router.get('/:pair/:timeframe', (req, res, next) => controller.getCandles(req, res, next))

export default router
