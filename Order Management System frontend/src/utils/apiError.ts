import axios from 'axios'

/** Readable message from API error responses or generic fallback. */
export function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string })?.message
    if (msg) return msg
    if (err.response?.status === 401) return 'Invalid email or password'
    if (err.response?.status === 409) return msg || 'Conflict — record may already exist'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

/** Firebase Auth errors (popup, OAuth domain, etc.). */
export function formatFirebaseAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code?: string }).code)
    if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled.'
    if (code === 'auth/popup-blocked')
      return 'Pop-up was blocked. Allow pop-ups for this site and try again.'
    if (code === 'auth/account-exists-with-different-credential')
      return 'An account already exists for this email with a different sign-in method.'
    if (code === 'auth/unauthorized-domain')
      return 'This domain is not allowed for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.'
    if (code === 'auth/operation-not-allowed')
      return 'Google sign-in is not enabled. Turn on Google in Firebase Console → Authentication → Sign-in method.'
  }
  return formatApiError(err)
}
