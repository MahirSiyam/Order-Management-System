import { Router } from 'express'
import * as categoryController from '../controllers/categoryController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/', asyncHandler(categoryController.getCategories))
router.post(
  '/',
  requireRoles('admin'),
  asyncHandler(categoryController.createCategory)
)

export default router
