/**
 * Use Express/Mongo API when VITE_USE_REMOTE_API is true or VITE_API_BASE_URL is an absolute URL.
 */
export function isRemoteApi(): boolean {
  const flag = import.meta.env.VITE_USE_REMOTE_API
  if (flag === 'true' || flag === '1') return true
  const base = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  return /^https?:\/\//i.test(base)
}
