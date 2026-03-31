/**
 * Client-side admin emails (must stay aligned with backend ADMIN_EMAILS / DEMO_AS_ADMIN).
 * Comma-separated in VITE_ADMIN_EMAILS, or default single admin.
 * If VITE_DEMO_AS_ADMIN=true, VITE_DEMO_EMAIL is treated as admin (mirror backend DEMO_*).
 */
const DEFAULT_ADMIN = 'mahirmubtasimsiyam@gamil.com'

function isTruthyEnv(v: string | undefined): boolean {
  return v === 'true' || v === '1'
}

export function resolveRoleFromEmail(email: string | null | undefined): 'admin' | 'user' {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  const demoEmail = String(import.meta.env.VITE_DEMO_EMAIL || '')
    .trim()
    .toLowerCase()
  if (
    isTruthyEnv(import.meta.env.VITE_DEMO_AS_ADMIN) &&
    demoEmail &&
    e === demoEmail
  ) {
    return 'admin'
  }
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS || '').trim()
  const list = raw
    ? raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [DEFAULT_ADMIN]
  return list.includes(e) ? 'admin' : 'user'
}
