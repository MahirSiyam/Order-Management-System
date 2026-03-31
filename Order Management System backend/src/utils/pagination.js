/**
 * Parse pagination query params with sane defaults.
 */
export function getPagination(query) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(query.limit || '10'), 10) || 10)
  )
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
