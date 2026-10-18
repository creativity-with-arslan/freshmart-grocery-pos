
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'

export async function createSale(req, res) {
  const session = await mongoose.startSession()

  try {
    const {
      items,
      discount = 0,
      paymentMethod,
      amountPaid,
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one product to the cart.',
      })
    }

    if (items.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'A sale cannot contain more than 100 cart items.',
      })
    }

    if (!['cash', 'card', 'mobile_wallet'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid payment method.',
      })
    }

    const discountAmount = Number(discount)

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount must be zero or greater.',
      })
    }

    const normalizedItems = []
    const seenProductIds = new Set()

    for (const item of items) {
      const productId = String(item.productId || '')
      const quantity = Number(item.quantity)

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message: 'The cart contains an invalid product.',
        })
      }

      if (seenProductIds.has(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Each product must appear only once in the cart.',
        })
      }

      seenProductIds.add(productId)

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Every product quantity must be greater than zero.',
        })
      }

      normalizedItems.push({ productId, quantity })
    }

    let savedSale

    await session.withTransaction(async () => {
      const saleItems = []
      let subtotal = 0

      // Read the product details and calculate prices from MongoDB.
      for (const item of normalizedItems) {
        const product = await Product.findById(item.productId)
          .session(session)

        if (!product) {
          const error = new Error(
            `A product in the cart no longer exists.`
          )
          error.statusCode = 404
          throw error
        }

        if (!Number.isFinite(product.price) || product.price < 0) {
          const error = new Error(
            `Product "${product.name}" has an invalid selling price.`
          )
          error.statusCode = 400
          throw error
        }

        if (item.quantity > Number(product.stock)) {
          const error = new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock}.`
          )
          error.statusCode = 400
          throw error
        }

        // Currency totals are rounded to two decimal places.
        const lineTotal = Math.round(
          (Number(product.price) * item.quantity + Number.EPSILON) * 100
        ) / 100

        subtotal += lineTotal

        saleItems.push({
          product: product._id,
          name: product.name,
          barcode: product.barcode || '',
          unit: product.unit,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        })
      }

      subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100

      if (discountAmount > subtotal) {
        const error = new Error('Discount cannot exceed the subtotal.')
        error.statusCode = 400
        throw error
      }

      const total = Math.round(
        (subtotal - discountAmount + Number.EPSILON) * 100
      ) / 100

      const paid =
        paymentMethod === 'cash'
          ? Number(amountPaid)
          : total

      if (!Number.isFinite(paid) || paid < 0) {
        const error = new Error('Enter a valid payment amount.')
        error.statusCode = 400
        throw error
      }

      if (paid < total) {
        const error = new Error(
          'The amount paid cannot be less than the total.'
        )
        error.statusCode = 400
        throw error
      }

      const changeDue = Math.round(
        (paid - total + Number.EPSILON) * 100
      ) / 100

      // Conditionally decrement each product's stock.
      // The stock check and update happen atomically for each product.
      for (const item of normalizedItems) {
        const updateResult = await Product.updateOne(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          { session }
        )

        if (updateResult.modifiedCount !== 1) {
          const error = new Error(
            'Stock changed during checkout. Refresh inventory and try again.'
          )
          error.statusCode = 409
          throw error
        }
      }

      // Generate a unique receipt number.
      const receiptNumber = `FM-${new mongoose.Types.ObjectId()
        .toString()
        .slice(-10)
        .toUpperCase()}`

      const records = await Sale.create(
        [
          {
            receiptNumber,
            items: saleItems,
            subtotal,
            discount: discountAmount,
            total,
            paymentMethod,
            amountPaid: paid,
            changeDue,
            status: 'completed',
          },
        ],
        { session }
      )

      savedSale = records[0]
    })

    return res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      data: savedSale,
    })
  } catch (error) {
    console.error('Create sale error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Unable to complete the sale. Please try again.',
    })
  } finally {
    await session.endSession()
  }
}

export async function getSales(req, res) {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    })
  } catch (error) {
    console.error('Get sales error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch sales history.',
    })
  }
}
