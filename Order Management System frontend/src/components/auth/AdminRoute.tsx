import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Only `admin` role (e.g. manage users). */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
