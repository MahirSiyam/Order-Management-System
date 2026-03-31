import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Admin-only areas (inventory, restock, etc.) — not portal `user` role. */
export function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const r = user?.role
  if (r === 'user') {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
