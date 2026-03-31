import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { OrderStatusBadge } from '../components/ui/OrderStatusBadge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { PaginationBar } from '../components/ui/PaginationBar'
import { useAppUser } from '../hooks/useAppUser'
import { useDebounce } from '../hooks/useDebounce'
import { queryKeys } from '../hooks/queryKeys'
import {
  cancelOrder,
  fetchOrders,
  fetchProducts,
  updateOrderStatus,
} from '../services/api'
import type { OrderStatus } from '../types/models'

const OPEN: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped']

export default function OrdersPage() {
  const { isStaff } = useAppUser()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const pageSize = 10

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize,
    }),
    [debouncedSearch, status, dateFrom, dateTo, page]
  )

  const ordersQ = useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => fetchOrders(params),
  })

  const productsQ = useQuery({
    queryKey: queryKeys.products({ page: 1, pageSize: 300 }),
    queryFn: () => fetchProducts({ page: 1, pageSize: 300 }),
  })

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of productsQ.data?.items ?? []) m.set(p.id, p.name)
    return m
  }, [productsQ.data])

  const statusM = useMutation({
    mutationFn: ({ id, s }: { id: string; s: OrderStatus }) =>
      updateOrderStatus(id, s),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      void qc.invalidateQueries({ queryKey: queryKeys.chartSeries })
      toast.success('Order updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const cancelM = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      void qc.invalidateQueries({ queryKey: queryKeys.chartSeries })
      toast.success('Order cancelled')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const searchSlot = (
    <input
      type="search"
      className="grow bg-transparent outline-none"
      placeholder="Search customer…"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
        setPage(1)
      }}
    />
  )

  return (
    <DashboardLayout
      title={isStaff ? 'Orders' : 'My orders'}
      searchSlot={searchSlot}
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="form-control">
            <span className="label-text text-xs font-medium">Status</span>
            <select
              className="select select-bordered select-sm rounded-xl"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | 'all')
                setPage(1)
              }}
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">From</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-xl"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-medium">To</span>
            <input
              type="date"
              className="input input-bordered input-sm rounded-xl"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>
        <Link to="/orders/new" className="btn btn-primary rounded-xl shadow-md">
          New order
        </Link>
      </div>

      <div className="mb-4 md:hidden">
        <label className="input input-bordered flex w-full rounded-xl">
          <input
            type="search"
            className="grow"
            placeholder="Search customer…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>

      {ordersQ.isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
            <div className="overflow-x-auto">
              <table className="table table-sm md:text-base">
                <thead className="bg-base-200/80">
                  <tr>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(ordersQ.data?.items ?? []).map((o) => (
                    <tr key={o.id} className="hover">
                      <td className="font-medium">{o.customerName}</td>
                      <td className="max-w-xs text-sm text-base-content/70">
                        {o.items
                          .map(
                            (i) =>
                              `${nameById.get(i.productId) ?? 'SKU'} × ${i.quantity}`
                          )
                          .join(', ')}
                      </td>
                      <td className="font-semibold">${o.total.toFixed(2)}</td>
                      <td>
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="whitespace-nowrap text-sm text-base-content/60">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {isStaff && o.status === 'Pending' ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-info rounded-lg"
                              disabled={statusM.isPending}
                              onClick={() =>
                                statusM.mutate({ id: o.id, s: 'Confirmed' })
                              }
                            >
                              Confirm
                            </button>
                          ) : null}
                          {isStaff && o.status === 'Confirmed' ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-info rounded-lg"
                              disabled={statusM.isPending}
                              onClick={() =>
                                statusM.mutate({ id: o.id, s: 'Shipped' })
                              }
                            >
                              Ship
                            </button>
                          ) : null}
                          {isStaff && o.status === 'Shipped' ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-success rounded-lg"
                              disabled={statusM.isPending}
                              onClick={() =>
                                statusM.mutate({ id: o.id, s: 'Delivered' })
                              }
                            >
                              Deliver
                            </button>
                          ) : null}
                          {OPEN.includes(o.status) ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-error"
                              disabled={cancelM.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    'Cancel this order and restore stock?'
                                  )
                                ) {
                                  cancelM.mutate(o.id)
                                }
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={ordersQ.data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </DashboardLayout>
  )
}
