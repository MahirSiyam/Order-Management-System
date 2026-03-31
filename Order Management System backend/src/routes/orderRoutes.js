import { Router } from 'express'
import * as orderController from '../controllers/orderController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/', asyncHandler(orderController.createOrder))
router.get('/', asyncHandler(orderController.getOrders))
router.patch(
  '/:id/status',
  requireRoles('admin'),
  asyncHandler(orderController.updateOrderStatus)
)
router.post('/:id/cancel', asyncHandler(orderController.cancelOrder))

export default router
