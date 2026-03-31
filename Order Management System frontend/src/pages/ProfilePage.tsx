import { User } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <DashboardLayout title="My profile">
      <div className="mx-auto max-w-lg">
        <div className="card rounded-2xl border border-base-300 bg-base-100 shadow-md">
          <div className="card-body gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{user?.name ?? '—'}</h2>
                <p className="text-sm text-base-content/60">{user?.email}</p>
              </div>
            </div>
            <div className="divider my-0" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">Role</dt>
                <dd className="font-medium capitalize">{user?.role}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">User ID</dt>
                <dd className="max-w-[12rem] truncate font-mono text-xs">
                  {user?.id}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
