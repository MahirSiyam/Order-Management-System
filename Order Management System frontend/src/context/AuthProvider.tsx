import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { resolveRoleFromEmail } from '../auth/roles'
import { clearToken, getToken, setToken } from '../auth/tokenStorage'
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase/config'
import { isRemoteApi } from '../services/apiConfig'
import type { AppUser } from '../types/models'
import { AuthContext, type SessionRole, type SessionUser } from './auth-context'

function sessionToAppUser(u: SessionUser): AppUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }
}

function apiOrigin(): string {
  const b = String(import.meta.env.VITE_API_BASE_URL || '').trim() || '/api'
  if (b.startsWith('/')) {
    return `${window.location.origin}${b}`.replace(/\/$/, '')
  }
  return b.replace(/\/$/, '')
}

function firebaseEnabled(): boolean {
  if (import.meta.env.VITE_USE_FIREBASE_AUTH === 'false') return false
  return isFirebaseConfigured()
}

function mapFirebaseUser(fb: FirebaseUser): SessionUser {
  return {
    id: fb.uid,
    name: fb.displayName?.trim() || fb.email?.split('@')[0] || 'User',
    email: String(fb.email || ''),
    role: resolveRoleFromEmail(fb.email),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const remote = isRemoteApi()
  const useFirebaseAuth = firebaseEnabled()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearApiMeCache = useCallback(() => {
    queryClient.removeQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === 'apiMe',
    })
  }, [queryClient])

  const seedApiMeCache = useCallback(
    (sessionUser: SessionUser) => {
      queryClient.setQueryData(
        ['apiMe', sessionUser.id],
        sessionToAppUser(sessionUser)
      )
    },
    [queryClient]
  )

  const hydrateJwt = useCallback(async () => {
    if (!remote) {
      setLoading(false)
      return
    }
    const token = getToken()
    if (!token) {
      setUser(null)
      clearApiMeCache()
      setLoading(false)
      return
    }
    try {
      const { data } = await axios.get<{ data: SessionUser }>(
        `${apiOrigin()}/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUser(data.data)
      seedApiMeCache(data.data)
    } catch {
      clearToken()
      setUser(null)
      clearApiMeCache()
    } finally {
      setLoading(false)
    }
  }, [remote, clearApiMeCache, seedApiMeCache])

  useEffect(() => {
    if (useFirebaseAuth) {
      const auth = getFirebaseAuth()
      const unsub = onAuthStateChanged(auth, async (fb) => {
        if (fb) {
          if (remote) {
            try {
              const idToken = await fb.getIdToken()
              const { data } = await axios.post<{
                data: { token: string; user: SessionUser }
              }>(`${apiOrigin()}/auth/firebase`, { idToken })
              setToken(data.data.token)
              setUser(data.data.user)
              seedApiMeCache(data.data.user)
            } catch (err: unknown) {
              clearToken()
              setUser(null)
              clearApiMeCache()
              const msg =
                axios.isAxiosError(err) &&
                (err.response?.data as { message?: string })?.message
                  ? String((err.response?.data as { message?: string }).message)
                  : 'Could not sign in with the API. Check backend Firebase config.'
              toast.error(msg)
            }
          } else {
            setUser(mapFirebaseUser(fb))
          }
        } else {
          clearToken()
          setUser(null)
          clearApiMeCache()
        }
        setLoading(false)
      })
      return () => unsub()
    }
    void hydrateJwt()
    return undefined
  }, [
    remote,
    useFirebaseAuth,
    hydrateJwt,
    seedApiMeCache,
    clearApiMeCache,
  ])

  const login = useCallback(
    async (email: string, password: string) => {
      if (useFirebaseAuth) {
        const auth = getFirebaseAuth()
        await signInWithEmailAndPassword(auth, email.trim(), password)
        return
      }
      if (!remote) {
        const hint = sessionStorage.getItem('demoLoginRole') as SessionRole | null
        const role: SessionRole =
          hint === 'user' || hint === 'admin' ? hint : 'admin'
        sessionStorage.removeItem('demoLoginRole')
        setUser({
          id: 'local',
          name: email.split('@')[0] || 'User',
          email,
          role,
        })
        return
      }
      const { data } = await axios.post<{
        data: { token: string; user: SessionUser }
      }>(`${apiOrigin()}/auth/login`, { email, password })
      setToken(data.data.token)
      setUser(data.data.user)
      seedApiMeCache(data.data.user)
    },
    [remote, useFirebaseAuth, seedApiMeCache]
  )

  const loginWithGoogle = useCallback(async () => {
    if (!useFirebaseAuth) {
      throw new Error(
        'Google sign-in needs Firebase. Set VITE_FIREBASE_* and enable Google in Firebase Console → Authentication → Sign-in method.',
      )
    }
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  }, [useFirebaseAuth])

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      if (useFirebaseAuth) {
        const auth = getFirebaseAuth()
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        )
        const display = name?.trim()
        if (display) {
          await updateProfile(cred.user, { displayName: display })
        }
        return
      }
      if (!remote) {
        const hint = sessionStorage.getItem('demoLoginRole') as SessionRole | null
        const role: SessionRole =
          hint === 'user' || hint === 'admin' ? hint : 'admin'
        sessionStorage.removeItem('demoLoginRole')
        setUser({
          id: 'local',
          name: name?.trim() || email.split('@')[0] || 'User',
          email,
          role,
        })
        return
      }
      const { data } = await axios.post<{
        data: { token: string; user: SessionUser }
      }>(`${apiOrigin()}/auth/register`, {
        email,
        password,
        name: name?.trim(),
      })
      setToken(data.data.token)
      setUser(data.data.user)
      seedApiMeCache(data.data.user)
    },
    [remote, useFirebaseAuth, seedApiMeCache]
  )

  const logout = useCallback(async () => {
    clearToken()
    setUser(null)
    clearApiMeCache()
    if (useFirebaseAuth) {
      const auth = getFirebaseAuth()
      await signOut(auth)
    }
  }, [useFirebaseAuth, clearApiMeCache])

  const value = useMemo(
    () => ({
      user,
      loading,
      remoteAuth: remote,
      useFirebaseAuth,
      login,
      signup,
      loginWithGoogle,
      logout,
    }),
    [user, loading, remote, useFirebaseAuth, login, signup, loginWithGoogle, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
