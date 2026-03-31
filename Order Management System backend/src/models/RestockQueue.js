import mongoose from 'mongoose'

const restockQueueSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    currentStock: { type: Number, required: true, min: 0 },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true,
    },
  },
  { timestamps: true }
)

restockQueueSchema.index({ currentStock: 1 })

export const RestockQueue = mongoose.model('RestockQueue', restockQueueSchema)
