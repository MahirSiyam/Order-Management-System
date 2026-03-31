import { ApiError } from '../utils/ApiError.js'

/**
 * Require an authenticated user whose role is one of the allowed values.
 * @param  {...('admin'|'user')} roles
 */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'))
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'Forbidden: this action requires a higher role')
      )
    }
    next()
  }
}
