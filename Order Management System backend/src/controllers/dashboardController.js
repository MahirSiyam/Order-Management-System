import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'

/**
 * Returns UTC day bounds for "today".
 */
function startEndOfTodayUtc() {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

/**
 * GET /api/dashboard/stats
 */
export async function getDashboardStats(req, res) {
  const { start, end } = startEndOfTodayUtc()

  const [
    ordersToday,
    revenueAgg,
    pendingOrders,
    completedOrders,
    lowStockCount,
  ] = await Promise.all([
    Order.countDocuments({
      createdAt: { $gte: start, $lt: end },
    }),
    Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          updatedAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({
      status: { $in: ['Pending', 'Confirmed', 'Shipped'] },
    }),
    Order.countDocuments({ status: 'Delivered' }),
    Product.countDocuments({
      $expr: { $lte: ['$stockQuantity', '$minStockThreshold'] },
    }),
  ])

  const revenueToday = revenueAgg[0]?.total ?? 0

  res.json({
    success: true,
    data: {
      ordersToday,
      revenueToday,
      pendingOrders,
      completedOrders,
      lowStockCount,
    },
  })
}
