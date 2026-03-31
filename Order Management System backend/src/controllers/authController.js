import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { logActivity } from '../utils/activityLogger.js'
import { signToken } from '../utils/jwt.js'
import { verifyFirebaseIdToken } from '../utils/verifyFirebaseIdToken.js'

/** Comma-separated list in env; default matches product requirement. */
export function roleFromEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  const demoEmail = String(process.env.DEMO_EMAIL || '')
    .trim()
    .toLowerCase()
  const demoAsAdmin =
    process.env.DEMO_AS_ADMIN === 'true' || process.env.DEMO_AS_ADMIN === '1'
  if (demoAsAdmin && demoEmail && e === demoEmail) {
    return 'admin'
  }
  const admins = String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const fallback = 'mahirmubtasimsiyam@gamil.com'
  const set = new Set(admins.length ? admins : [fallback])
  return set.has(e) ? 'admin' : 'user'
}

function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
  }
}

/**
 * POST /api/auth/register
 * Body: { email, password, name? }
 * First user in the database becomes admin; later signups are users.
 */
export async function register(req, res) {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase()
  const password = String(req.body.password || '')
  const name = String(req.body.name || '').trim() || email.split('@')[0] || 'User'

  if (!email) {
    throw new ApiError(400, 'Email is required')
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters')
  }

  const exists = await User.exists({ email })
  if (exists) {
    throw new ApiError(409, 'Email already registered')
  }

  const count = await User.countDocuments()
  const role = count === 0 ? 'admin' : 'user'

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    email,
    passwordHash,
    name,
    role,
  })

  const token = signToken(user._id.toString(), user.email, user.role)
  await logActivity(`User registered: ${email} (${role})`)

  res.status(201).json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  })
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase()
  const password = String(req.body.password || '')

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user) {
    throw new ApiError(401, 'Invalid email or password')
  }
  if (!user.passwordHash) {
    throw new ApiError(
      401,
      'This account uses Firebase sign-in. Use Sign in with Firebase on the app.'
    )
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const token = signToken(user._id.toString(), user.email, user.role)

  res.json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  })
}

/**
 * POST /api/auth/firebase
 * Body: { idToken } — verifies Firebase ID token, upserts Mongo user, returns JWT.
 */
export async function firebaseLogin(req, res) {
  const idToken = String(req.body.idToken || '').trim()
  if (!idToken) {
    throw new ApiError(400, 'idToken is required')
  }

  const decoded = await verifyFirebaseIdToken(idToken)
  const email = decoded.email
  if (!email) {
    throw new ApiError(400, 'Firebase token has no email')
  }

  const name =
    decoded.name ||
    email.split('@')[0] ||
    'User'
  const uid = decoded.uid
  const emailRole = roleFromEmail(email)

  let user = await User.findOne({
    $or: [{ firebaseUid: uid }, { email }],
  }).select('+passwordHash')

  if (!user) {
    user = await User.create({
      email,
      name,
      firebaseUid: uid,
      role: emailRole,
    })
    await logActivity(`Firebase user registered: ${email} (${emailRole})`)
  } else {
    if (!user.firebaseUid) {
      user.firebaseUid = uid
    }
    user.name = name
    if (emailRole === 'admin') {
      user.role = 'admin'
    } else if (user.role === 'admin') {
      /* keep admin */
    } else {
      user.role = 'user'
    }
    await user.save()
  }

  const token = signToken(user._id.toString(), user.email, user.role)

  res.json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  })
}
