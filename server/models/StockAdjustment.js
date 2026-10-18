
import mongoose from 'mongoose'

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['increase', 'decrease'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
)

export default mongoose.model('StockAdjustment', stockAdjustmentSchema)
