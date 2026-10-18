
import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
)

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'A sale must contain at least one product.',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_wallet'],
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    changeDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['completed'],
      default: 'completed',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Sale', saleSchema)
