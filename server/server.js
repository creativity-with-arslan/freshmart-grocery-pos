
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import connectDB from './config/db.js'
import saleRoutes from './routes/saleRoutes.js'
import productRoutes from './routes/productRoutes.js'
import authRoutes from './routes/authRoutes.js'
import stockAdjustmentRoutes from './routes/stockAdjustmentRoutes.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
)

app.use(express.json())

// Connect to MongoDB before handling API requests.
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    console.error('Database unavailable:', error.message)

    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again later.',
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Grocery POS API is running',
  })
})

app.use('/api/products', productRoutes)
app.use('/api/stock-adjustments', stockAdjustmentRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/auth', authRoutes)

// Vercel imports this app; local development starts its own listener.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
