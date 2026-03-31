import { ActivityLog } from '../models/ActivityLog.js'

/**
 * Persists an activity row for dashboard / audit trail.
 * @param {string} message
 */
export async function logActivity(message) {
  await ActivityLog.create({ message, timestamp: new Date() })
}
