import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyToken } from '../utils/jwt.js'

/**
 * Verifies JWT (Authorization: Bearer <token>) and attaches req.user from MongoDB.
 */
export const verifyJwt = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid Authorization header')
  }
  const raw = header.slice(7).trim()
  if (!raw) {
    throw new ApiError(401, 'Missing token')
  }

  let payload
  try {
    payload = verifyToken(raw)
  } catch {
    throw new ApiError(401, 'Invalid or expired token')
  }

  const userId = payload.sub
  if (!userId) {
    throw new ApiError(401, 'Invalid token payload')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(401, 'User no longer exists')
  }

  req.user = user
  next()
})
