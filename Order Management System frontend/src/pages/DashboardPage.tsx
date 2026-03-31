import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Kanban,
  Package,
  PackageSearch,
  UserCircle,
  CircleDollarSign,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { StockBadge } from '../components/ui/StockBadge'
import { useAuth } from '../hooks/useAuth'
import { useAppUser } from '../hooks/useAppUser'
import { queryKeys } from '../hooks/queryKeys'
import {
  fetchActivities,
  fetchChartSeries,
  fetchDashboardStats,
  fetchOrders,
  fetchProductSummary,
} from '../services/api'

const statIconTones = {
  primary:
    'border-sky-200/90 bg-gradient-to-br from-sky-50 to-sky-100/70 text-sky-700 shadow-sm ring-1 ring-sky-900/5',
  warning:
    'border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-800 shadow-sm ring-1 ring-amber-900/5',
  danger:
    'border-rose-200/90 bg-gradient-to-br from-rose-50 to-rose-100/70 text-rose-700 shadow-sm ring-1 ring-rose-900/5',
  success:
    'border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-emerald-100/70 text-emerald-800 shadow-sm ring-1 ring-emerald-900/5',
} as const

/** User dashboard quick links — explicit tints so Lucide strokes stay visible (not flat theme squares). */
const userQuickActionIconTones = {
  create: statIconTones.primary,
  orders:
    'border-cyan-200/90 bg-gradient-to-br from-cyan-50 to-sky-50/80 text-cyan-800 shadow-sm ring-1 ring-cyan-900/5',
  profile:
    'border-violet-200/90 bg-gradient-to-br from-violet-50 to-indigo-50/75 text-violet-800 shadow-sm ring-1 ring-violet-900/5',
} as const

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  tone: keyof typeof statIconTones
}) {
  return (
    <div className="card rounded-2xl border border-base-200 bg-base-100 shadow-sm transition hover:shadow-md">
      <div className="card-body gap-3 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-base-content/60">{title}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-base-content">
              {value}
            </p>
            {subtitle ? (
              <p className="mt-1 text-xs text-base-content/50">{subtitle}</p>
            ) : null}
          </div>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statIconTones[tone]}`}
            aria-hidden
          >
            <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  )
}

function UserPortalDashboard() {
  const { user } = useAuth()

  const ordersSummary = useQuery({
    queryKey: queryKeys.orders({
      page: 1,
      pageSize: 1,
      status: 'all',
    }),
    queryFn: () =>
      fetchOrders({ page: 1, pageSize: 1, status: 'all' }),
    enabled: !!user,
  })

  const totalOrders = ordersSummary.data?.total ?? 0

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 pb-4">
        <section className="rounded-xl border border-base-200 bg-base-100 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="text-sm leading-relaxed text-base-content/65">
                Place orders and track shipments from one place.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link
                  to="/orders/new"
                  className="btn btn-primary min-h-11 gap-2 rounded-xl border-0 px-5 font-semibold text-white shadow-md transition hover:brightness-95 active:brightness-90"
                >
                  <Package className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  New order
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-white/90"
                    aria-hidden
                  />
                </Link>
                <Link
                  to="/orders"
                  className="btn btn-ghost min-h-11 gap-2 rounded-xl border-2 border-base-300 bg-base-100 font-semibold text-base-content shadow-sm hover:border-base-400 hover:bg-base-200"
                >
                  View my orders
                </Link>
              </div>
            </div>
            <div className="flex w-full shrink-0 justify-end lg:w-auto">
              <div className="stat w-full max-w-[14rem] rounded-xl border border-base-200 bg-base-200/30 py-4 lg:w-auto">
                <div className="stat-figure place-items-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${statIconTones.primary}`}
                    aria-hidden
                  >
                    <ClipboardList
                      className="h-5 w-5 shrink-0"
                      strokeWidth={2}
                    />
                  </div>
                </div>
                <div className="stat-title text-[0.65rem] font-medium uppercase tracking-wide text-base-content/55">
                  Your orders
                </div>
                <div className="stat-value text-2xl text-base-content">
                  {ordersSummary.isLoading ? (
                    <span className="loading loading-dots loading-md text-primary" />
                  ) : (
                    totalOrders
                  )}
                </div>
                <div className="stat-desc text-xs text-base-content/55">
                  In your account
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/orders/new"
            className="group rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary/30 hover:bg-base-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:brightness-[1.02] ${userQuickActionIconTones.create}`}
                aria-hidden
              >
                <Package className="h-6 w-6 shrink-0" strokeWidth={2} />
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-base-content/40 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-base-content">
              Create order
            </h3>
            <p className="mt-0.5 text-xs text-base-content/60">
              Browse catalog and checkout.
            </p>
          </Link>

          <Link
            to="/orders"
            className="group rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-cyan-300/50 hover:bg-base-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:brightness-[1.02] ${userQuickActionIconTones.orders}`}
                aria-hidden
              >
                <ClipboardList className="h-6 w-6 shrink-0" strokeWidth={2} />
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-base-content/40 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-base-content">
              My orders
            </h3>
            <p className="mt-0.5 text-xs text-base-content/60">
              Status and order history.
            </p>
          </Link>

          <Link
            to="/profile"
            className="group rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-violet-300/50 hover:bg-base-50 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:brightness-[1.02] ${userQuickActionIconTones.profile}`}
                aria-hidden
              >
                <UserCircle className="h-6 w-6 shrink-0" strokeWidth={2} />
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-base-content/40 transition group-hover:translate-x-0.5 group-hover:text-violet-700" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-base-content">
              Profile
            </h3>
            <p className="mt-0.5 text-xs text-base-content/60">
              Name, email, account.
            </p>
          </Link>
        </div>

        <p className="rounded-lg border border-dashed border-base-300/80 bg-base-200/40 px-3 py-2.5 text-center text-xs text-base-content/60">
          Admin-only tools (inventory, reports) are hidden. You can order and view
          your history.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  const { isStaff } = useAppUser()

  const statsQ = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
    enabled: isStaff,
  })
  const actQ = useQuery({
    queryKey: queryKeys.activities,
    queryFn: () => fetchActivities(10),
    enabled: isStaff,
  })
  const chartQ = useQuery({
    queryKey: queryKeys.chartSeries,
    queryFn: fetchChartSeries,
    enabled: isStaff,
  })
  const summaryQ = useQuery({
    queryKey: queryKeys.productSummary,
    queryFn: () => fetchProductSummary(5),
    enabled: isStaff,
  })

  const loading =
    isStaff &&
    (statsQ.isLoading ||
      actQ.isLoading ||
      chartQ.isLoading ||
      summaryQ.isLoading)

  if (!isStaff) {
    return <UserPortalDashboard />
  }

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Orders today"
              value={statsQ.data?.ordersToday ?? 0}
              subtitle="Created since midnight"
              icon={CalendarClock}
              tone="primary"
            />
            <StatCard
              title="Pending vs completed"
              value={`${statsQ.data?.pendingOrders ?? 0} / ${statsQ.data?.completedOrders ?? 0}`}
              subtitle="Open pipeline / delivered total"
              icon={Kanban}
              tone="warning"
            />
            <StatCard
              title="Low stock SKUs"
              value={statsQ.data?.lowStockCount ?? 0}
              subtitle="At or below minimum threshold"
              icon={PackageSearch}
              tone="danger"
            />
            <StatCard
              title="Revenue today"
              value={`$${(statsQ.data?.revenueToday ?? 0).toFixed(2)}`}
              subtitle="Delivered orders only"
              icon={CircleDollarSign}
              tone="success"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card rounded-2xl border border-base-200 bg-base-100 shadow-sm xl:col-span-2">
              <div className="card-body">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Orders & revenue</h2>
                  <span className="badge badge-ghost">Last 7 days (UTC)</span>
                </div>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartQ.data ?? []}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="oklch(var(--p))"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(var(--p))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid oklch(var(--b3))',
                        }}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="oklch(var(--p))"
                        fillOpacity={1}
                        fill="url(#rev)"
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke="oklch(var(--in))"
                        fillOpacity={0.1}
                        fill="oklch(var(--in))"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card rounded-2xl border border-base-200 bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="mb-4 text-lg font-semibold">Activity</h2>
                <ul className="space-y-3">
                  {(actQ.data ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-base-200 bg-base-200/40 px-3 py-2.5 text-sm"
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
          </div>

          <div className="card rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Product summary</h2>
                <span className="badge badge-outline">Sample of catalog</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(summaryQ.data ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-base-200 bg-base-200/30 p-4 shadow-inner"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{p.name}</p>
                      <StockBadge product={p} />
                    </div>
                    <p className="mt-2 text-2xl font-bold">${p.price.toFixed(2)}</p>
                    <p className="text-sm text-base-content/60">
                      Stock: {p.stock}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
