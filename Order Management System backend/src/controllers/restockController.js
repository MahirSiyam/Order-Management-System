import mongoose from 'mongoose'
import { Product } from '../models/Product.js'
import { RestockQueue } from '../models/RestockQueue.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'
import { upsertRestockEntry } from '../utils/restockHelpers.js'

/**
 * GET /api/restock-queue — sorted by lowest currentStock first
 */
export async function getRestockQueue(req, res) {
  const items = await RestockQueue.find()
    .populate('productId')
    .sort({ currentStock: 1 })
    .lean()

  res.json({ success: true, data: items })
}

/**
 * PATCH /api/restock-queue/:productId — body: { newStock } absolute level
 */
export async function restockProduct(req, res) {
  const { productId } = req.params
  const raw = Number(req.body.newStock)
  const newStock = Math.max(0, Math.floor(raw))

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product id')
  }
  if (!Number.isFinite(raw) || raw < 0) {
    throw new ApiError(400, 'newStock must be a non-negative number')
  }

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  product.stockQuantity = newStock
  if (newStock <= 0) {
    product.status = 'Out of Stock'
  } else {
    product.status = 'Active'
  }
  await product.save()

  await upsertRestockEntry(
    product._id,
    product.stockQuantity,
    product.minStockThreshold
  )

  await logActivity(
    `Restocked ${product.name} to ${newStock} units`
  )

  const queueEntry = await RestockQueue.findOne({ productId: product._id }).lean()

  res.json({
    success: true,
    data: { product, queueEntry },
  })
}

/**
 * DELETE /api/restock-queue/:productId — remove row only (does not change inventory)
 */
export async function removeFromQueue(req, res) {
  const { productId } = req.params
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const result = await RestockQueue.deleteOne({ productId })
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'Product not in restock queue')
  }

  await logActivity(`Removed product ${productId} from restock queue (entry only)`)
  res.json({ success: true, message: 'Removed from restock queue' })
}
