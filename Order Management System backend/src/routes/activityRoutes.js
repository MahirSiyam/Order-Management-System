import { Router } from 'express'
import * as activityController from '../controllers/activityController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  requireRoles('admin'),
  asyncHandler(activityController.getRecentActivity)
)

export default router
