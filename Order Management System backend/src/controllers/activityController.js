import { ActivityLog } from '../models/ActivityLog.js'

/**
 * GET /api/activity — last 10 activities (newest first)
 */
export async function getRecentActivity(req, res) {
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10)
  )

  const items = await ActivityLog.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()

  res.json({ success: true, data: items })
}
