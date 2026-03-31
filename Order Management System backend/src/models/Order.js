import mongoose from 'mongoose'

const orderLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    /** Set for orders placed by authenticated portal users (role user). */
    placedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: { type: String, required: true, trim: true },
    products: { type: [orderLineSchema], required: true, validate: (v) => v.length > 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  /** createdAt / updatedAt — order creation time is `createdAt` */
  { timestamps: true }
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ placedByUserId: 1, createdAt: -1 })

export const Order = mongoose.model('Order', orderSchema)
