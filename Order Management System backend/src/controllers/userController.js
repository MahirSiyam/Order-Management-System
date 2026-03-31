import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'

/**
 * GET /api/users — list users (admin only).
 */
export async function listUsers(req, res) {
  const users = await User.find()
    .select('name email role createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json({
    success: true,
    data: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt:
        u.createdAt instanceof Date
          ? u.createdAt.toISOString()
          : String(u.createdAt ?? ''),
    })),
  })
}

/**
 * GET /api/me — current Mongo user (role for UI).
 */
export async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  })
}

/**
 * PATCH /api/users/:id/role — admin only; body { role: 'admin' | 'user' }
 */
export async function updateUserRole(req, res) {
  const { id } = req.params
  const { role } = req.body

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid user id')
  }
  if (!['admin', 'user'].includes(role)) {
    throw new ApiError(400, 'role must be admin or user')
  }

  const user = await User.findById(id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  user.role = role
  await user.save()
  await logActivity(`User ${user.email} role set to ${role}`)

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}
