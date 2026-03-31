import mongoose from 'mongoose'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { RestockQueue } from '../models/RestockQueue.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'
import { getPagination } from '../utils/pagination.js'
import { computePriority } from '../utils/restockHelpers.js'

/**
 * POST /api/orders — transactional stock deduction + restock queue + activity
 * Body: { customerName, items: [{ productId, quantity }] }
 */
export async function createOrder(req, res) {
  const customerName = String(req.body.customerName || '').trim()
  const items = req.body.items

  if (!customerName) {
    throw new ApiError(400, 'Customer name is required')
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one line item is required')
  }

  const productIds = items.map((i) => String(i.productId))
  const unique = new Set(productIds)
  if (unique.size !== productIds.length) {
    throw new ApiError(409, 'Product already added')
  }

  for (const line of items) {
    if (!mongoose.isValidObjectId(line.productId)) {
      throw new ApiError(400, 'Invalid product id in line item')
    }
    const qty = Number(line.quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ApiError(400, 'Each quantity must be a positive integer')
    }
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const ids = productIds.map((id) => new mongoose.Types.ObjectId(id))
    const products = await Product.find({ _id: { $in: ids } })
      .session(session)
      .exec()

    if (products.length !== ids.length) {
      throw new ApiError(404, 'One or more products not found')
    }

    const byId = new Map(products.map((p) => [p._id.toString(), p]))
    const lines = []

    for (const line of items) {
      const p = byId.get(String(line.productId))
      if (p.status !== 'Active') {
        throw new ApiError(400, 'Product unavailable')
      }
      const qty = Number(line.quantity)
      if (p.stockQuantity < qty) {
        throw new ApiError(400, 'Insufficient stock')
      }
      lines.push({
        productId: p._id,
        quantity: qty,
        price: p.price,
      })
    }

    const totalPrice = lines.reduce(
      (sum, l) => sum + l.price * l.quantity,
      0
    )

    for (const line of lines) {
      const p = byId.get(line.productId.toString())
      p.stockQuantity -= line.quantity
      if (p.stockQuantity <= 0) {
        p.stockQuantity = 0
        p.status = 'Out of Stock'
      }
      await p.save({ session })

      await upsertRestockEntryWithSession(
        session,
        p._id,
        p.stockQuantity,
        p.minStockThreshold
      )
    }

    const [order] = await Order.create(
      [
        {
          placedByUserId: req.user?._id ?? null,
          customerName,
          products: lines,
          totalPrice,
          status: 'Pending',
        },
      ],
      { session }
    )

    await session.commitTransaction()
    await logActivity(
      `Order ${order._id} created for ${customerName} — $${totalPrice.toFixed(2)}`
    )

    const populated = await Order.findById(order._id)
      .populate('products.productId')
      .lean()

    res.status(201).json({ success: true, data: populated })
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/**
 * Restock queue upsert inside a MongoDB transaction session.
 */
async function upsertRestockEntryWithSession(
  session,
  productId,
  currentStock,
  minStockThreshold
) {
  if (currentStock > minStockThreshold) {
    await RestockQueue.deleteOne({ productId }).session(session)
    return
  }
  const priority = computePriority(currentStock, minStockThreshold)
  await RestockQueue.findOneAndUpdate(
    { productId },
    { $set: { currentStock, priority } },
    { upsert: true, new: true, session }
  )
}

/**
 * PATCH /api/orders/:id/status — body: { status }
 */
export async function updateOrderStatus(req, res) {
  const { id } = req.params
  const { status } = req.body

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid order id')
  }

  const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      'Invalid status. Use cancel endpoint to cancel an order.'
    )
  }

  const order = await Order.findById(id)
  if (!order) {
    throw new ApiError(404, 'Order not found')
  }
  if (order.status === 'Cancelled') {
    throw new ApiError(400, 'Cannot change status of a cancelled order')
  }
  if (order.status === 'Delivered') {
    throw new ApiError(400, 'Order is already delivered')
  }

  const prev = order.status
  order.status = status
  await order.save()
  await logActivity(
    `Order ${order._id} status: ${prev} → ${status}`
  )

  const populated = await Order.findById(order._id)
    .populate('products.productId')
    .lean()

  res.json({ success: true, data: populated })
}

/**
 * POST /api/orders/:id/cancel — restore stock, set Cancelled
 */
export async function cancelOrder(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid order id')
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const order = await Order.findById(id).session(session)
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (
      req.user?.role === 'user' &&
      String(order.placedByUserId || '') !== String(req.user._id)
    ) {
      throw new ApiError(403, 'You can only cancel your own orders')
    }
    if (order.status === 'Cancelled') {
      await session.commitTransaction()
      return res.json({ success: true, data: order, message: 'Already cancelled' })
    }
    if (order.status === 'Delivered') {
      throw new ApiError(400, 'Cannot cancel a delivered order')
    }

    for (const line of order.products) {
      const product = await Product.findById(line.productId).session(session)
      if (!product) continue
      product.stockQuantity += line.quantity
      if (product.stockQuantity > 0) {
        product.status = 'Active'
      }
      await product.save({ session })
      if (product.stockQuantity > product.minStockThreshold) {
        await RestockQueue.deleteOne({ productId: product._id }).session(session)
      } else {
        await upsertRestockEntryWithSession(
          session,
          product._id,
          product.stockQuantity,
          product.minStockThreshold
        )
      }
    }

    order.status = 'Cancelled'
    await order.save({ session })
    await session.commitTransaction()

    await logActivity(`Order ${order._id} cancelled — stock restored`)

    const populated = await Order.findById(order._id)
      .populate('products.productId')
      .lean()

    res.json({ success: true, data: populated })
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/**
 * GET /api/orders — filters: status, dateFrom, dateTo, q (customer search), pagination
 */
export async function getOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query)
  const { status, dateFrom, dateTo } = req.query
  const q = String(req.query.q || req.query.search || '').trim()

  const filter = {}
  if (req.user?.role === 'user') {
    filter.placedByUserId = req.user._id
  }
  if (status && status !== 'all') {
    filter.status = status
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom)
    }
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }
  if (q) {
    filter.customerName = {
      $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    }
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('products.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  })
}
