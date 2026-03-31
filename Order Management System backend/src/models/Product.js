import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minStockThreshold: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Out of Stock'],
      default: 'Active',
    },
  },
  { timestamps: true }
)

export const Product = mongoose.model('Product', productSchema)
