import saleRoutes from './routes/saleRoutes.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
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
app.use('/api/products', productRoutes)
app.use('/api/stock-adjustments', stockAdjustmentRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Grocery POS API is running',
  })
})

const startServer = async () => {
  await connectDB()

  const PORT = process.env.PORT || 5000

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()
