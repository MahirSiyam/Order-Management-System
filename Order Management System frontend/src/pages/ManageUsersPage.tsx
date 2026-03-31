import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { fetchUsers, updateUserRole } from '../services/api'
import type { AppUser } from '../types/models'

const ROLES: AppUser['role'][] = ['admin', 'user']

export default function ManageUsersPage() {
  const qc = useQueryClient()
  const [pending, setPending] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['users', 'list'],
    queryFn: fetchUsers,
  })

  const m = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppUser['role'] }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      void qc.invalidateQueries({ queryKey: ['apiMe'] })
      toast.success('Role updated')
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setPending(null),
  })

  return (
    <DashboardLayout title="Manage users">
      {q.isLoading ? (
        <PageLoader />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-base-200/80">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((u) => (
                  <tr key={u.id} className="hover">
                    <td className="font-medium">{u.name}</td>
                    <td className="text-sm">{u.email}</td>
                    <td>
                      <select
                        className="select select-bordered select-sm rounded-xl"
                        value={u.role}
                        disabled={m.isPending && pending === u.id}
                        onChange={(e) => {
                          const role = e.target.value as AppUser['role']
                          if (role === u.role) return
                          setPending(u.id)
                          m.mutate({ id: u.id, role })
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap text-sm text-base-content/60">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
