import { useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
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
import { isRemoteApi } from '../../services/apiConfig'
import { formatApiError, formatFirebaseAuthError } from '../../utils/apiError'

export default function SignupPage() {
  const { signup, loginWithGoogle, user, loading, useFirebaseAuth } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const confirmId = useId()

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      await signup(email, password, name.trim() || undefined)
      toast.success('Account created')
      navigate('/', { replace: true })
    } catch (err: unknown) {
      toast.error(formatApiError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!useFirebaseAuth) {
      toast.error(
        'Google sign-up needs Firebase. Set VITE_FIREBASE_* in .env and enable Google under Authentication → Sign-in method.',
      )
      return
    }
    setGoogleBusy(true)
    try {
      await loginWithGoogle()
      toast.success('Account ready')
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : ''
      if (code === 'auth/popup-closed-by-user') return
      toast.error(formatFirebaseAuthError(err))
    } finally {
      setGoogleBusy(false)
    }
  }

  const formLocked = busy || googleBusy || loading

  return (
    <AuthLayout mode="signup">
      <h1 className="sr-only">Create an InventraX account</h1>
      <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Join InventraX
      </p>
      <p className="mt-2 text-base text-slate-500">
        Create your workspace account
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {useFirebaseAuth
          ? 'Use your email and a strong password (min. 6 characters).'
          : isRemoteApi()
            ? 'First registrant becomes admin; others join as portal users.'
            : 'Local demo — details stay in this browser session.'}
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor={nameId} className={authFieldLabel}>
            Display name{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            className={authFieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Cooper"
            disabled={formLocked}
          />
        </div>

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
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              className={`${authFieldInput} pr-12`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a strong password"
              disabled={formLocked}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPw ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={confirmId} className={authFieldLabel}>
            Confirm password
          </label>
          <div className="relative">
            <input
              id={confirmId}
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              className={`${authFieldInput} pr-12`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              disabled={formLocked}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              tabIndex={-1}
            >
              {showConfirm ? (
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
          onClick={() => void handleGoogleSignUp()}
          className={authGoogleBtn}
          disabled={formLocked}
          aria-busy={googleBusy}
        >
          {googleBusy ? (
            <span className="loading loading-spinner loading-sm text-primary" />
          ) : (
            <GoogleColoredIcon />
          )}
          {googleBusy ? 'Connecting…' : 'Sign up with Google'}
        </button>

        <button
          type="submit"
          className={authPrimaryBtn}
          disabled={formLocked}
          aria-busy={busy}
        >
          {busy ? (
            <span className="loading loading-spinner loading-md text-white" />
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className={authLinkAccent}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
