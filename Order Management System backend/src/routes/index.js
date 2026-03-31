import { Router } from 'express'
import { verifyJwt } from '../middleware/auth.js'
import { requireRoles } from '../middleware/roles.js'
import * as userController from '../controllers/userController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import activityRoutes from './activityRoutes.js'
import analyticsRoutes from './analyticsRoutes.js'
import authRoutes from './authRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import restockRoutes from './restockRoutes.js'

const router = Router()

/** Public */
router.use('/auth', authRoutes)

/** Protected — JWT required */
router.use(verifyJwt)

router.get('/me', asyncHandler(userController.getMe))
router.get(
  '/users',
  requireRoles('admin'),
  asyncHandler(userController.listUsers)
)
router.patch(
  '/users/:id/role',
  requireRoles('admin'),
  asyncHandler(userController.updateUserRole)
)

router.use('/analytics', analyticsRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/orders', orderRoutes)
router.use('/restock-queue', restockRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/activity', activityRoutes)

export default router
