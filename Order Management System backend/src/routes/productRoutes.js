import { Router } from 'express'
import * as productController from '../controllers/productController.js'
import { requireRoles } from '../middleware/roles.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/', asyncHandler(productController.getProducts))
router.post(
  '/',
  requireRoles('admin'),
  asyncHandler(productController.createProduct)
)
router.patch(
  '/:id',
  requireRoles('admin'),
  asyncHandler(productController.updateProduct)
)
router.delete(
  '/:id',
  requireRoles('admin'),
  asyncHandler(productController.deleteProduct)
)

export default router
