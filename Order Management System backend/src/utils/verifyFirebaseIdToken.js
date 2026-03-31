import { createRemoteJWKSet, jwtVerify } from 'jose'
import { ApiError } from './ApiError.js'

/**
 * Verify Firebase Auth ID tokens using Google's JWKS (no Firebase Admin SDK).
 * @see https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
)

/**
 * @param {string} idToken
 * @returns {Promise<{ uid: string, email: string, name: string }>}
 */
export async function verifyFirebaseIdToken(idToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  if (!projectId) {
    throw new ApiError(
      503,
      'Set FIREBASE_PROJECT_ID in backend .env to the same value as VITE_FIREBASE_PROJECT_ID (Firebase Console → Project settings).'
    )
  }

  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })

    const uid = String(payload.sub || '')
    const email = payload.email ? String(payload.email).trim().toLowerCase() : ''
    const name = payload.name ? String(payload.name).trim() : ''

    return { uid, email, name }
  } catch {
    throw new ApiError(401, 'Invalid or expired Firebase ID token')
  }
}
