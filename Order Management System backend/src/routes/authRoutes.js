import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/firebase', asyncHandler(authController.firebaseLogin))

export default router
