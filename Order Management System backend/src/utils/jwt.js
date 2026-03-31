import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

export function assertJwtSecret() {
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET is required in .env')
  }
}

/**
 * @param {string} userId - Mongo _id string
 * @param {string} email
 * @param {string} role
 */
export function signToken(userId, email, role) {
  assertJwtSecret()
  return jwt.sign({ sub: userId, email, role }, secret, { expiresIn })
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string }}
 */
export function verifyToken(token) {
  assertJwtSecret()
  return jwt.verify(token, secret)
}
