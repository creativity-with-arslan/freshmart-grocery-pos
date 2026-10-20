
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
})

function createToken(user) {
  return jwt.sign(
    { sub: String(user._id) },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
}

function validPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 10 &&
    password.length <= 72
  )
}

export async function setupFirstAdmin(req, res, next) {
  try {
    const setupKey = process.env.ADMIN_SETUP_KEY
    const providedKey = req.get('x-setup-key')

    if (!setupKey || !providedKey || providedKey !== setupKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing setup key.',
      })
    }

    const existingUser = await User.exists({})

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Initial administrator setup has already been completed.',
      })
    }

    const { name, email, password } = req.body || {}

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254 ||
      !validPassword(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Provide a valid name, email, and password of 10–72 characters.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const admin = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'admin',
    })

    return res.status(201).json({
      success: true,
      message: 'Initial administrator created successfully.',
      data: {
        user: publicUser(admin),
        token: createToken(admin),
      },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    return next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {}

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.length > 254 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email and password.',
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash')

    if (
      !user ||
      !user.active ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: publicUser(user),
        token: createToken(user),
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getCurrentUser(req, res) {
  return res.json({
    success: true,
    data: { user: req.user },
  })
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body || {}

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254 ||
      !validPassword(password) ||
      !['admin', 'cashier'].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Provide a valid name, email, password of 10–72 characters, and role.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    })

    return res.status(201).json({
      success: true,
      data: { user: publicUser(user) },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    return next(error)
  }
}

export async function getUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('name email role active createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      success: true,
      data: { users },
    })
  } catch (error) {
    return next(error)
  }
}
const MAIN_ADMIN_EMAIL = 'admin@freshmart.local'

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params
    const { name, email, role } = req.body || {}

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 254 ||
      !['admin', 'cashier'].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide a valid name, email, and role.',
      })
    }

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      })
    }

    if (user.email.toLowerCase() === MAIN_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'The main administrator account cannot be edited.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail === MAIN_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for the main administrator.',
      })
    }

    user.name = name.trim()
    user.email = normalizedEmail
    user.role = role

    await user.save()

    return res.json({
      success: true,
      message: 'User account updated successfully.',
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    return next(error)
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      })
    }

    if (user.email.toLowerCase() === MAIN_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'The main administrator account cannot be deleted.',
      })
    }

    await user.deleteOne()

    return res.json({
      success: true,
      message: 'User account deleted successfully.',
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      })
    }

    return next(error)
  }
}