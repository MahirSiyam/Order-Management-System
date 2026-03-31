import mongoose from 'mongoose'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { RestockQueue } from '../models/RestockQueue.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'
import { getPagination } from '../utils/pagination.js'
import { upsertRestockEntry } from '../utils/restockHelpers.js'

/**
 * POST /api/products
 */
export async function createProduct(req, res) {
  const { name, category, price, stockQuantity, minStockThreshold, status } =
    req.body

  if (!name?.trim()) {
    throw new ApiError(400, 'Product name is required')
  }
  if (!mongoose.isValidObjectId(category)) {
    throw new ApiError(400, 'Valid category id is required')
  }
  if (price === undefined || Number(price) < 0) {
    throw new ApiError(400, 'Valid price is required')
  }

  const stock = Number(stockQuantity ?? 0)
  const minTh = Number(minStockThreshold ?? 0)
  let productStatus = status === 'Out of Stock' ? 'Out of Stock' : 'Active'
  if (stock <= 0) {
    productStatus = 'Out of Stock'
  }

  const product = await Product.create({
    name: name.trim(),
    category,
    price: Number(price),
    stockQuantity: stock,
    minStockThreshold: minTh,
    status: productStatus,
  })

  await upsertRestockEntry(product._id, product.stockQuantity, product.minStockThreshold)
  await logActivity(`Product created: ${product.name}`)
  res.status(201).json({ success: true, data: product })
}

/**
 * GET /api/products — pagination + search (name contains, case-insensitive)
 */
export async function getProducts(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const q = String(req.query.q || req.query.search || '').trim()
  const category = req.query.category

  const filter = {}
  if (q) {
    filter.name = { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
  }
  if (category && mongoose.isValidObjectId(category)) {
    filter.category = category
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  })
}

/**
 * PATCH /api/products/:id
 */
export async function updateProduct(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const product = await Product.findById(id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  const {
    name,
    category,
    price,
    stockQuantity,
    minStockThreshold,
    status,
  } = req.body

  if (name !== undefined) product.name = String(name).trim()
  if (category !== undefined) {
    if (!mongoose.isValidObjectId(category)) {
      throw new ApiError(400, 'Invalid category id')
    }
    product.category = category
  }
  if (price !== undefined) product.price = Number(price)
  if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity)
  if (minStockThreshold !== undefined) {
    product.minStockThreshold = Number(minStockThreshold)
  }
  if (status !== undefined) {
    if (!['Active', 'Out of Stock'].includes(status)) {
      throw new ApiError(400, 'Invalid status')
    }
    product.status = status
  }

  if (product.stockQuantity <= 0) {
    product.status = 'Out of Stock'
  } else if (product.status === 'Out of Stock' && product.stockQuantity > 0) {
    product.status = 'Active'
  }

  await product.save()
  await upsertRestockEntry(
    product._id,
    product.stockQuantity,
    product.minStockThreshold
  )

  await logActivity(`Product updated: ${product.name}`)
  res.json({ success: true, data: product })
}

/**
 * DELETE /api/products/:id
 */
export async function deleteProduct(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const inOrder = await Order.exists({ 'products.productId': id })
  if (inOrder) {
    throw new ApiError(
      409,
      'Cannot delete product that appears on an order'
    )
  }

  const product = await Product.findByIdAndDelete(id)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  await RestockQueue.deleteOne({ productId: id })

  await logActivity(`Product deleted: ${product.name}`)
  res.json({ success: true, message: 'Product deleted' })
}
