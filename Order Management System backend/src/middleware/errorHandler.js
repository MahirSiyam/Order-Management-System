import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'

/**
 * Central error handler: operational ApiError → JSON; Mongoose → 400; else 500.
 */
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: messages.join('; ') || 'Validation error',
    })
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key — record already exists',
    })
  }

  console.error(err)
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  })
}
