
import express from 'express'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import { adjustStock } from '../controllers/stockAdjustmentController.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// Both admins and cashiers need product data to complete checkout.
router.get(
  '/',
  authenticateToken,
  requireRole('admin', 'cashier'),
  getProducts
)

// Product management is admin-only.
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  createProduct
)

router.put(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  updateProduct
)

router.delete(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  deleteProduct
)

// Only admins can make manual stock adjustments.
router.post(
  '/:id/adjust-stock',
  authenticateToken,
  requireRole('admin'),
  adjustStock
)

export default router
