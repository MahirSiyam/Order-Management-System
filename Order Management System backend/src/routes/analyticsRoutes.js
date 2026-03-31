import { Router } from 'express'
import * as analyticsController from '../controllers/analyticsController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/chart',
  requireRoles('admin'),
  asyncHandler(analyticsController.getAnalyticsChart)
)

export default router
