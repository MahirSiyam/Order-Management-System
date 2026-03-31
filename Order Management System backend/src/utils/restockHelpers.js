import { RestockQueue } from '../models/RestockQueue.js'

/** @typedef {'High' | 'Medium' | 'Low'} Priority */

/**
 * Derive restock priority from current stock vs minimum threshold.
 * @param {number} stockQuantity
 * @param {number} minStockThreshold
 * @returns {Priority}
 */
export function computePriority(stockQuantity, minStockThreshold) {
  if (minStockThreshold <= 0) return 'Low'
  if (stockQuantity <= 0 || stockQuantity <= minStockThreshold * 0.25) {
    return 'High'
  }
  if (stockQuantity <= minStockThreshold * 0.75) {
    return 'Medium'
  }
  return 'Low'
}

/**
 * Upsert restock queue row when stock is at or below threshold after a change.
 * @param {import('mongoose').Types.ObjectId} productId
 * @param {number} currentStock
 * @param {number} minStockThreshold
 */
export async function upsertRestockEntry(productId, currentStock, minStockThreshold) {
  if (currentStock > minStockThreshold) {
    await RestockQueue.deleteOne({ productId })
    return
  }
  const priority = computePriority(currentStock, minStockThreshold)
  await RestockQueue.findOneAndUpdate(
    { productId },
    {
      $set: {
        currentStock,
        priority,
      },
    },
    { upsert: true, new: true }
  )
}

/**
 * Remove queue entry if stock is above threshold (e.g. after restock or cancel).
 */
export async function maybeRemoveFromRestockQueue(
  productId,
  stockQuantity,
  minStockThreshold
) {
  if (stockQuantity > minStockThreshold) {
    await RestockQueue.deleteOne({ productId })
  }
}
