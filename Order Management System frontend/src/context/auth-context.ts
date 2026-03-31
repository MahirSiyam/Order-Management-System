import { createContext } from 'react'

export type SessionRole = 'admin' | 'user'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: SessionRole
}

export type AuthContextValue = {
  user: SessionUser | null
  /** True until first auth resolution (Firebase listener or JWT hydrate). */
  loading: boolean
  /** Remote Express API + JWT (or Firebase exchange). */
  remoteAuth: boolean
  /** Firebase Email/Password is active (not legacy JWT-only login). */
  useFirebaseAuth: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  /** Firebase Google popup; same session + API exchange as email login. */
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
