import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import {
  AuthOrDivider,
  authFieldInput,
  authFieldLabel,
  authGoogleBtn,
  authLinkAccent,
  authPrimaryBtn,
  GoogleColoredIcon,
} from '../../components/auth/AuthFormShared'
import { useAuth } from '../../hooks/useAuth'
import { getFirebaseAuth } from '../../firebase/config'
import { isRemoteApi } from '../../services/apiConfig'
import { formatApiError, formatFirebaseAuthError } from '../../utils/apiError'

const DEMO_EMAIL =
  import.meta.env.VITE_DEMO_EMAIL || 'demo@inventory.app'
const DEMO_PASSWORD =
  import.meta.env.VITE_DEMO_PASSWORD || 'DemoPass123!'

const DEMO_USER_EMAIL =
  String(import.meta.env.VITE_DEMO_USER_EMAIL || '').trim() ||
  'portal@inventory.app'
const DEMO_USER_PASSWORD =
  String(import.meta.env.VITE_DEMO_USER_PASSWORD || '').trim() ||
  DEMO_PASSWORD

const DEMO_ADMIN_EMAIL =
  String(import.meta.env.VITE_DEMO_ADMIN_EMAIL || '').trim() || DEMO_EMAIL
const DEMO_ADMIN_PASSWORD =
  String(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '').trim() ||
  DEMO_PASSWORD

const DEMO_LOGIN_ROLE_KEY = 'demoLoginRole'

function firebaseErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code?: string }).code)
  }
  return ''
}

async function ensureFirebaseEmailPassword(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  const auth = getFirebaseAuth()
  const e = email.trim()
  try {
    await signInWithEmailAndPassword(auth, e, password)
    return
  } catch {
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, password)
      await updateProfile(cred.user, { displayName })
    } catch (second: unknown) {
      const c = firebaseErrorCode(second)
      if (c === 'auth/email-already-in-use') {
        throw new Error(
          'This email is already registered with a different password. Reset it in Firebase Console or align your .env password.',
        )
      }
      if (c === 'auth/weak-password') {
        throw new Error(
          'Password is too weak for Firebase (min. 6 characters).',
        )
      }
      throw second
    }
  }
}

const demoBtn =
  'w-full cursor-pointer rounded-xl border-2 border-slate-200/90 bg-slate-50 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out hover:border-primary hover:bg-white hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 disabled:shadow-none disabled:opacity-100 disabled:hover:border-slate-200 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 disabled:hover:shadow-none'

export default function LoginPage() {
  const { login, signup, loginWithGoogle, useFirebaseAuth, user, loading } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname

  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signInBusy, setSignInBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoAdminBusy, setDemoAdminBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const formLocked =
    signInBusy || demoBusy || demoAdminBusy || googleBusy || loading

  useEffect(() => {
    if (user && !loading) {
      navigate(from || '/', { replace: true })
    }
  }, [user, loading, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    sessionStorage.removeItem(DEMO_LOGIN_ROLE_KEY)
    setSignInBusy(true)
    try {
      await login(email, password)
      toast.success('Welcome back')
      navigate(from || '/', { replace: true })
    } catch (err: unknown) {
      toast.error(formatApiError(err))
    } finally {
      setSignInBusy(false)
    }
  }

  const runDemoLogin = async () => {
    setDemoBusy(true)
    setEmail(DEMO_USER_EMAIL)
    setPassword(DEMO_USER_PASSWORD)
    try {
      if (useFirebaseAuth) {
        await ensureFirebaseEmailPassword(
          DEMO_USER_EMAIL,
          DEMO_USER_PASSWORD,
          'Portal demo',
        )
        toast.success('Opening your portal…')
        return
      }
      if (isRemoteApi()) {
        try {
          await login(DEMO_USER_EMAIL, DEMO_USER_PASSWORD)
        } catch {
          await signup(DEMO_USER_EMAIL, DEMO_USER_PASSWORD, 'Portal demo')
        }
        toast.success('Welcome — portal dashboard')
        navigate(from || '/', { replace: true })
        return
      }
      sessionStorage.setItem(DEMO_LOGIN_ROLE_KEY, 'user')
      await login(DEMO_USER_EMAIL, DEMO_USER_PASSWORD)
      toast.success('Signed in (portal demo)')
      navigate(from || '/', { replace: true })
    } catch (err: unknown) {
      sessionStorage.removeItem(DEMO_LOGIN_ROLE_KEY)
      toast.error(formatApiError(err))
    } finally {
      setDemoBusy(false)
    }
  }

  const runDemoAdminLogin = async () => {
    setDemoAdminBusy(true)
    setEmail(DEMO_ADMIN_EMAIL)
    setPassword(DEMO_ADMIN_PASSWORD)
    try {
      if (useFirebaseAuth) {
        await ensureFirebaseEmailPassword(
          DEMO_ADMIN_EMAIL,
          DEMO_ADMIN_PASSWORD,
          'Demo admin',
        )
        toast.success('Opening staff dashboard…')
        return
      }
      if (isRemoteApi()) {
        try {
          await login(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
        } catch {
          await signup(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, 'Demo admin')
        }
        toast.success('Welcome — admin dashboard')
        navigate(from || '/', { replace: true })
        return
      }
      sessionStorage.setItem(DEMO_LOGIN_ROLE_KEY, 'admin')
      await login(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
      toast.success('Signed in (admin demo)')
      navigate(from || '/', { replace: true })
    } catch (err: unknown) {
      sessionStorage.removeItem(DEMO_LOGIN_ROLE_KEY)
      toast.error(formatApiError(err))
    } finally {
      setDemoAdminBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!useFirebaseAuth) {
      toast.error(
        'Google sign-in needs Firebase. Set VITE_FIREBASE_* in .env and enable Google under Authentication → Sign-in method.',
      )
      return
    }
    setGoogleBusy(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome back')
      navigate(from || '/', { replace: true })
    } catch (err: unknown) {
      if (firebaseErrorCode(err) === 'auth/popup-closed-by-user') return
      toast.error(formatFirebaseAuthError(err))
    } finally {
      setGoogleBusy(false)
    }
  }

  return (
    <AuthLayout mode="login">
      <h1 className="sr-only">Sign in to InventraX</h1>
      <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Hi there
      </p>
      <p className="mt-2 text-base text-slate-500">Welcome to InventraX</p>
      <p className="mt-1 text-sm text-slate-400">
        {useFirebaseAuth
          ? 'Sign in with your email and password.'
          : isRemoteApi()
            ? 'Use your workspace credentials.'
            : 'Offline demo — any password works.'}
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor={emailId} className={authFieldLabel}>
            Email
          </label>
          <input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            className={authFieldInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={formLocked}
          />
        </div>

        <div>
          <label htmlFor={passwordId} className={authFieldLabel}>
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className={`${authFieldInput} pr-12`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={formLocked}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <AuthOrDivider />

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          className={authGoogleBtn}
          disabled={formLocked}
          aria-busy={googleBusy}
        >
          {googleBusy ? (
            <span className="loading loading-spinner loading-sm text-primary" />
          ) : (
            <GoogleColoredIcon />
          )}
          {googleBusy ? 'Connecting…' : 'Login with Google'}
        </button>

        <button
          type="submit"
          className={authPrimaryBtn}
          disabled={formLocked}
          aria-busy={signInBusy}
        >
          {signInBusy ? (
            <span className="loading loading-spinner loading-md text-white" />
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className="mt-8 space-y-2 border-t border-slate-100 pt-6">
        <p className="text-center text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
          Quick demo
        </p>
        <button
          type="button"
          className={demoBtn}
          disabled={formLocked}
          aria-busy={demoBusy}
          onClick={() => void runDemoLogin()}
        >
          {demoBusy ? (
            <span className="loading loading-spinner loading-sm text-rose-700" />
          ) : null}{' '}
          {demoBusy ? 'Starting…' : 'Demo login as User'}
        </button>
        <button
          type="button"
          className={demoBtn}
          disabled={formLocked}
          aria-busy={demoAdminBusy}
          onClick={() => void runDemoAdminLogin()}
        >
          {demoAdminBusy ? (
            <span className="loading loading-spinner loading-sm text-primary" />
          ) : null}{' '}
          {demoAdminBusy ? 'Starting…' : 'Demo login as Admin'}
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className={authLinkAccent}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
