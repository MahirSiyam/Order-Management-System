import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { queryKeys } from '../hooks/queryKeys'
import { fetchActivities } from '../services/api'

export default function ActivityLogsPage() {
  const q = useQuery({
    queryKey: [...queryKeys.activities, 'full'],
    queryFn: () => fetchActivities(100),
  })

  return (
    <DashboardLayout title="Activity logs">
      {q.isLoading ? (
        <PageLoader />
      ) : (
        <div className="card rounded-2xl border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <ul className="space-y-3">
              {(q.data ?? []).map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-base-200 bg-base-200/40 px-4 py-3 text-sm"
                >
                  <p className="font-medium leading-snug">{a.message}</p>
                  <p className="mt-1 text-xs text-base-content/50">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
