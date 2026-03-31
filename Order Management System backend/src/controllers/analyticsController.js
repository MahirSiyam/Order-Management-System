import { Order } from '../models/Order.js'

/**
 * Build UTC date keys for the last `days` days (inclusive of today).
 */
function dateKeysForLastDays(days) {
  const keys = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

/**
 * GET /api/analytics/chart?days=7
 * Daily order count and revenue (from Delivered orders created that UTC day).
 */
export async function getAnalyticsChart(req, res) {
  const days = Math.min(30, Math.max(1, parseInt(String(req.query.days || '7'), 10) || 7))
  const keys = dateKeysForLastDays(days)
  const start = new Date(`${keys[0]}T00:00:00.000Z`)

  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
        },
        orders: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalPrice', 0],
          },
        },
      },
    },
  ])

  const byDay = new Map(agg.map((row) => [row._id, row]))
  const data = keys.map((date) => {
    const row = byDay.get(date)
    return {
      date,
      orders: row?.orders ?? 0,
      revenue: row?.revenue ?? 0,
    }
  })

  res.json({ success: true, data })
}
