import { useQuery } from '@tanstack/react-query'
import { isRemoteApi } from '../services/apiConfig'
import { fetchMe } from '../services/api'
import type { AppUser } from '../types/models'
import { useAuth } from './useAuth'

export type AppRole = 'admin' | 'user'

/**
 * Role comes from the auth session first (correct on first paint after login).
 * GET /api/me refines the same user when `q.data.id === user.id` (per-user query key).
 */
export function useAppUser() {
  const { user } = useAuth()
  const remote = isRemoteApi()

  const q = useQuery({
    queryKey: ['apiMe', user?.id ?? 'none'],
    queryFn: fetchMe,
    enabled: remote && !!user,
    staleTime: 60_000,
  })

  if (!remote) {
    const r = (user?.role ?? 'admin') as AppRole
    return {
      role: r,
      isAdmin: r === 'admin',
      isStaff: r === 'admin',
      isCustomer: r === 'user',
      isLoading: false,
      user: null,
      displayRole: r,
    }
  }

  if (!user) {
    return {
      role: 'user' as AppRole,
      isAdmin: false,
      isStaff: false,
      isCustomer: true,
      isLoading: false,
      user: null,
      displayRole: 'user' as AppRole,
    }
  }

  const meForUser =
    q.data?.id === user.id ? q.data : null

  const role = (meForUser?.role ?? user.role) as AppRole

  const mergedUser: AppUser | null = meForUser ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
  }

  return {
    role,
    isAdmin: role === 'admin',
    isStaff: role === 'admin',
    isCustomer: role === 'user',
    isLoading: false,
    user: mergedUser,
    displayRole: role,
  }
}
