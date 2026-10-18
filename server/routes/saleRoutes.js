
import express from 'express'
import {
  createSale,
  getSales,
} from '../controllers/saleController.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// Administrators can review sales history.
router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  getSales
)

// Both admins and cashiers can complete checkout.
router.post(
  '/',
  authenticateToken,
  requireRole('admin', 'cashier'),
  createSale
)

export default router
