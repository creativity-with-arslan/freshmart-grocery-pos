
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function authenticateToken(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''
    const [scheme, token] = authorization.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured.',
      })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (
      typeof payload !== 'object' ||
      !payload.sub ||
      typeof payload.sub !== 'string'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    const user = await User.findById(payload.sub)

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'This account is unavailable. Please log in again.',
      })
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    }

    return next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Your session is invalid or expired. Please log in again.',
      })
    }

    return next(error)
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      })
    }

    return next()
  }
}
