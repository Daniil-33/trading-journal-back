/**
 * Indicator Routes
 */

import { Router } from 'express'
import { IndicatorController } from '../controllers/indicator.controller'

const router = Router()

/**
 * @route   POST /api/indicators
 * @desc    Create a new indicator
 * @access  Public (add auth middleware if needed)
 */
router.post('/', IndicatorController.create)

/**
 * @route   GET /api/indicators
 * @desc    Get all indicators with optional filters
 * @query   country, impact, currencies (comma-separated)
 * @access  Public (add auth middleware if needed)
 */
router.get('/', IndicatorController.getAll)

/**
 * @route   GET /api/indicators/publications/statistics
 * @desc    Get publication statistics with filters
 * @query   indicatorId, startDate, endDate, limit, skip
 * @access  Public (add auth middleware if needed)
 */
router.get('/publications/statistics', IndicatorController.getPublicationsStatistics)

/**
 * @route   GET /api/indicators/:id
 * @desc    Get indicator by ID
 * @access  Public (add auth middleware if needed)
 */
router.get('/:id', IndicatorController.getById)

/**
 * @route   POST /api/indicators/import
 * @desc    Bulk import indicators (skips existing ones)
 * @access  Public (add auth middleware if needed)
 */
router.post('/import', IndicatorController.import)

export default router
