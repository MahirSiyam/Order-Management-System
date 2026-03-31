import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

activityLogSchema.index({ timestamp: -1 })

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
