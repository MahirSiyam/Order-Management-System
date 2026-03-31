import { Router } from 'express'
import * as restockController from '../controllers/restockController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  requireRoles('admin'),
  asyncHandler(restockController.getRestockQueue)
)
router.patch(
  '/:productId',
  requireRoles('admin'),
  asyncHandler(restockController.restockProduct)
)
router.delete(
  '/:productId',
  requireRoles('admin'),
  asyncHandler(restockController.removeFromQueue)
)

export default router
