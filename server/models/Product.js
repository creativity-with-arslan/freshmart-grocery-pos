
import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'pack', 'dozen'],
      default: 'piece',
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low-stock threshold cannot be negative'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

const Product = mongoose.model('Product', productSchema)

export default Product
