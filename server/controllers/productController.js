
import Product from '../models/Product.js'

// GET: Fetch all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    })
  }
}

// POST: Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      category,
      price,
      costPrice,
      stock,
      unit,
      lowStockThreshold,
      expiryDate,
    } = req.body

    if (
      !name?.trim() ||
      !category?.trim() ||
      price === undefined ||
      price === '' ||
      costPrice === undefined ||
      costPrice === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, selling price and cost price are required',
      })
    }

    const product = await Product.create({
      name,
      barcode: barcode?.trim() || undefined,
      category,
      price,
      costPrice,
      stock,
      unit,
      lowStockThreshold,
      expiryDate: expiryDate || null,
    })

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This barcode already exists',
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    })
  }
}

// PUT: Update an existing product
export const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'barcode',
      'category',
      'price',
      'costPrice',
      'stock',
      'unit',
      'lowStockThreshold',
      'expiryDate',
    ]

    const updates = {}

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field]
      }
    }

    // Treat an empty barcode as "no barcode".
    if (
      Object.hasOwn(updates, 'barcode') &&
      !String(updates.barcode ?? '').trim()
    ) {
      delete updates.barcode
      updates.$unset = { barcode: 1 }
    } else if (Object.hasOwn(updates, 'barcode')) {
      updates.barcode = String(updates.barcode).trim()
    }

    if (Object.hasOwn(updates, 'expiryDate') && !updates.expiryDate) {
      updates.expiryDate = null
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This barcode already exists',
      })
    }

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    })
  }
}

// DELETE: Remove a product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    })
  }
}
