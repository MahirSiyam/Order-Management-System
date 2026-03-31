import { Category } from '../models/Category.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'

/**
 * POST /api/categories
 */
export async function createCategory(req, res) {
  const name = String(req.body.name || '').trim()
  if (!name) {
    throw new ApiError(400, 'Category name is required')
  }

  const category = await Category.create({ name })
  await logActivity(`Category created: ${name}`)
  res.status(201).json({ success: true, data: category })
}

/**
 * GET /api/categories
 */
export async function getCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 }).lean()
  res.json({ success: true, data: categories })
}
