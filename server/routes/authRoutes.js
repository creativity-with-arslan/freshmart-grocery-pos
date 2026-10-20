import express from 'express'
import {
  setupFirstAdmin,
  login,
  getCurrentUser,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from '../controllers/authController.js'
import {
  authenticateToken,
  requireRole,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// One-time initial administrator setup.
router.post('/setup-admin', setupFirstAdmin)

// Public login.
router.post('/login', login)

// Authenticated profile.
router.get('/me', authenticateToken, getCurrentUser)

// Admin-only user management.
router.get(
  '/users',
  authenticateToken,
  requireRole('admin'),
  getUsers
)

router.post(
  '/users',
  authenticateToken,
  requireRole('admin'),
  createUser
)

router.patch(
  '/users/:id',
  authenticateToken,
  requireRole('admin'),
  updateUser
)

router.delete(
  '/users/:id',
  authenticateToken,
  requireRole('admin'),
  deleteUser
)

export default router