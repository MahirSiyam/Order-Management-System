import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { queryKeys } from '../hooks/queryKeys'
import { createOrder, fetchProducts } from '../services/api'
import type { Product } from '../types/models'

type Line = { productId: string; quantity: number }

export default function CreateOrderPage() {
  const qc = useQueryClient()
  const [customerName, setCustomerName] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  const productsQ = useQuery({
    queryKey: queryKeys.products({ page: 1, pageSize: 200 }),
    queryFn: () => fetchProducts({ page: 1, pageSize: 200 }),
  })

  const productById = useMemo(() => {
    const m = new Map<string, Product>()
    for (const p of productsQ.data?.items ?? []) m.set(p.id, p)
    return m
  }, [productsQ.data])

  const selectedIds = useMemo(() => new Set(lines.map((l) => l.productId)), [lines])

  const availableToAdd = useMemo(() => {
    return (productsQ.data?.items ?? []).filter(
      (p) => !selectedIds.has(p.id) && p.status === 'Active'
    )
  }, [productsQ.data, selectedIds])

  const addLine = () => {
    const first = availableToAdd[0]
    if (!first) {
      toast.error('No more active products to add')
      return
    }
    setLines((L) => [...L, { productId: first.id, quantity: 1 }])
  }

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((L) => {
      const next = [...L]
      const cur = { ...next[index], ...patch }
      next[index] = cur
      return next
    })
  }

  const removeLine = (index: number) => {
    setLines((L) => L.filter((_, i) => i !== index))
  }

  const total = useMemo(() => {
    let s = 0
    for (const l of lines) {
      const p = productById.get(l.productId)
      if (p) s += p.price * l.quantity
    }
    return s
  }, [lines, productById])

  const createM = useMutation({
    mutationFn: () =>
      createOrder({
        customerName,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.chartSeries })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      toast.success('Order created')
      setCustomerName('')
      setLines([])
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (productsQ.isLoading) {
    return (
      <DashboardLayout title="Create order">
        <PageLoader label="Loading products" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Create order">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base-content/70">
          Build a cart with unique SKUs. Inactive items cannot be selected.
        </p>
        <Link
          to="/orders"
          className="btn btn-ghost btn-sm min-h-10 rounded-xl border border-base-300 font-medium text-base-content hover:bg-base-200"
        >
          View orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card rounded-2xl border border-base-300 bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body gap-4">
            <label className="form-control w-full max-w-md">
              <span className="label-text font-medium">Customer name</span>
              <input
                className="input input-bordered min-h-12 rounded-xl border-base-300 pl-4 text-base"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Cooper"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-base-content">Line items</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm min-h-10 gap-1.5 rounded-xl px-4 font-semibold text-white shadow-sm hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:border-0 disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100 disabled:hover:brightness-100"
                onClick={addLine}
                disabled={!availableToAdd.length}
                title={
                  !availableToAdd.length
                    ? 'No active products left to add'
                    : 'Add a line item'
                }
              >
                Add product
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-base-300 bg-slate-50/90 px-4 py-10 text-center text-sm leading-relaxed text-base-content/75">
                No products yet. Use{' '}
                <span className="font-semibold text-base-content">Add product</span>{' '}
                to start.
              </p>
            ) : (
              <div className="space-y-4">
                {lines.map((line, idx) => {
                  const p = productById.get(line.productId)
                  const over = p ? line.quantity > p.stock : false
                  return (
                    <div
                      key={`${line.productId}-${idx}`}
                      className="rounded-2xl border border-base-200 bg-base-200/30 p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                        <label className="form-control sm:col-span-6">
                          <span className="label-text text-xs font-medium">
                            Product
                          </span>
                          <select
                            className="select select-bordered select-sm rounded-xl"
                            value={line.productId}
                            onChange={(e) => {
                              const id = e.target.value
                              if (selectedIds.has(id) && id !== line.productId) {
                                toast.error('Product already in order')
                                return
                              }
                              const np = productById.get(id)
                              if (np && np.status !== 'Active') {
                                toast.error('Cannot select inactive product')
                                return
                              }
                              updateLine(idx, { productId: id, quantity: 1 })
                            }}
                          >
                            {(productsQ.data?.items ?? [])
                              .filter(
                                (pr) =>
                                  pr.status === 'Active' &&
                                  (pr.id === line.productId ||
                                    !selectedIds.has(pr.id))
                              )
                              .map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                  {pr.stock === 0 ? ' (no stock)' : ''}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label className="form-control sm:col-span-3">
                          <span className="label-text text-xs font-medium">
                            Quantity
                          </span>
                          <input
                            type="number"
                            min={1}
                            className="input input-bordered input-sm rounded-xl"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(idx, {
                                quantity: Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                ),
                              })
                            }
                          />
                        </label>
                        <div className="flex gap-2 sm:col-span-3 sm:justify-end">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-error"
                            aria-label="Remove line"
                            onClick={() => removeLine(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {p ? (
                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          <span className="text-base-content/60">
                            Unit: ${p.price.toFixed(2)} · Available: {p.stock}
                          </span>
                          {over ? (
                            <span className="badge badge-error badge-sm">
                              Only {p.stock} items available
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card rounded-2xl border border-base-300 bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="text-sm text-base-content/60">
              Totals update as you edit quantities.
            </p>
            <div className="divider my-2" />
            <div className="flex items-baseline justify-between">
              <span className="text-base-content/70">Total</span>
              <span className="text-3xl font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary mt-4 min-h-12 w-full gap-2 rounded-xl border-0 font-semibold text-white shadow-md transition hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100 disabled:hover:brightness-100"
              disabled={
                createM.isPending ||
                !customerName.trim() ||
                !lines.length ||
                lines.some((l) => {
                  const pr = productById.get(l.productId)
                  return !pr || l.quantity > pr.stock || pr.status !== 'Active'
                })
              }
              onClick={() => createM.mutate()}
            >
              {createM.isPending ? (
                <span className="loading loading-spinner loading-sm text-white" />
              ) : null}
              Place order
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
