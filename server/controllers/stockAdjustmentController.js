
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import StockAdjustment from '../models/StockAdjustment.js'

export async function adjustStock(req, res) {
  const session = await mongoose.startSession()

  try {
    const { type, quantity, reason, notes = '' } = req.body
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    if (!['increase', 'decrease'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be increase or decrease.',
      })
    }

    const amount = Number(quantity)

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a number greater than zero.',
      })
    }

    if (typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for the adjustment.',
      })
    }

    if (reason.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Reason cannot exceed 200 characters.',
      })
    }

    if (typeof notes !== 'string' || notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 500 characters.',
      })
    }

    let savedAdjustment

    await session.withTransaction(async () => {
      const product = await Product.findById(id).session(session)

      if (!product) {
        const error = new Error('Product not found.')
        error.statusCode = 404
        throw error
      }

      const previousStock = Number(product.stock) || 0

      if (type === 'decrease' && amount > previousStock) {
        const error = new Error(
          `Insufficient stock. Available quantity: ${previousStock}.`
        )
        error.statusCode = 400
        throw error
      }

      const newStock =
        type === 'increase'
          ? previousStock + amount
          : previousStock - amount

      // Only update if the stock still has the value we read.
      // This prevents simultaneous adjustments from overwriting each other.
      const updateResult = await Product.updateOne(
        { _id: product._id, stock: product.stock },
        { $set: { stock: newStock } },
        { session }
      )

      if (updateResult.modifiedCount !== 1) {
        const error = new Error(
          'Stock changed during this operation. Please try again.'
        )
        error.statusCode = 409
        throw error
      }

      const records = await StockAdjustment.create(
        [
          {
            product: product._id,
            productName: product.name,
            type,
            quantity: amount,
            previousStock,
            newStock,
            reason: reason.trim(),
            notes: notes.trim(),
          },
        ],
        { session }
      )

      savedAdjustment = records[0]
    })

    return res.status(201).json({
      success: true,
      message: 'Stock adjusted successfully.',
      data: savedAdjustment,
    })
  } catch (error) {
    console.error('Stock adjustment error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to adjust stock. Please try again.',
    })
  } finally {
    await session.endSession()
  }
}

export async function getStockAdjustments(req, res) {
  try {
    const adjustments = await StockAdjustment.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return res.status(200).json({
      success: true,
      count: adjustments.length,
      data: adjustments,
    })
  } catch (error) {
    console.error('Get stock adjustments error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch stock adjustment history.',
    })
  }
}
