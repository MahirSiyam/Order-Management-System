import { Router } from 'express'
import * as dashboardController from '../controllers/dashboardController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/stats',
  requireRoles('admin'),
  asyncHandler(dashboardController.getDashboardStats)
)

export default router
