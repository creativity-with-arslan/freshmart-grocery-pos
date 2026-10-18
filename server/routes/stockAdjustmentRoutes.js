
import express from 'express'
import { getStockAdjustments } from '../controllers/stockAdjustmentController.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/authMiddleware.js'

const router = express.Router()

router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  getStockAdjustments
)

export default router
