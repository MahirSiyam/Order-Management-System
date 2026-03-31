import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AppModal } from '../components/ui/AppModal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { StockBadge } from '../components/ui/StockBadge'
import { useAppUser } from '../hooks/useAppUser'
import { queryKeys } from '../hooks/queryKeys'
import { isRemoteApi } from '../services/apiConfig'
import {
  fetchRestockQueue,
  removeFromRestockQueue,
  restockPriorityFor,
  updateProductStock,
} from '../services/api'
import type { Product, RestockPriority } from '../types/models'

function PriorityBadge({ p }: { p: RestockPriority }) {
  const map = {
    High: 'badge-error',
    Medium: 'badge-warning',
    Low: 'badge-info',
  } as const
  return (
    <span className={`badge badge-sm ${map[p]}`}>{p} priority</span>
  )
}

export default function RestockPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAppUser()
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState('')

  const queueQ = useQuery({
    queryKey: queryKeys.restockQueue,
    queryFn: fetchRestockQueue,
  })

  const restockM = useMutation({
    mutationFn: () =>
      updateProductStock(modalProduct!.id, Number(newStock)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      void qc.invalidateQueries({ queryKey: queryKeys.chartSeries })
      toast.success('Stock updated')
      setModalProduct(null)
      setNewStock('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeM = useMutation({
    mutationFn: (productId: string) => removeFromRestockQueue(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      toast.success('Removed from queue')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DashboardLayout title="Restock queue">
      <p className="mb-6 max-w-2xl text-base-content/70">
        Products at or below their minimum threshold, sorted by lowest on-hand
        quantity first. Priority highlights how urgent each line is.
      </p>

      {queueQ.isLoading ? (
        <PageLoader />
      ) : !(queueQ.data ?? []).length ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-10 text-center shadow-md">
          <p className="text-lg font-medium">All clear</p>
          <p className="mt-2 text-sm text-base-content/60">
            No SKUs are currently below minimum stock.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-base-200/80">
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                  <th>Priority</th>
                  <th>Badge</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(queueQ.data ?? []).map((p) => (
                  <tr key={p.id} className="hover">
                    <td className="font-medium">{p.name}</td>
                    <td>{p.stock}</td>
                    <td>{p.minThreshold}</td>
                    <td>
                      <PriorityBadge p={restockPriorityFor(p)} />
                    </td>
                    <td>
                      <StockBadge product={p} />
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm rounded-xl"
                          onClick={() => {
                            setModalProduct(p)
                            setNewStock(
                              String(
                                Math.max(p.minThreshold * 2, p.stock + 10)
                              )
                            )
                          }}
                        >
                          Restock
                        </button>
                        {isAdmin && isRemoteApi() ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm rounded-xl text-error"
                            disabled={removeM.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Remove this row from the queue only (does not change stock)?'
                                )
                              ) {
                                removeM.mutate(p.id)
                              }
                            }}
                          >
                            Remove
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
      )}

      <AppModal
        open={!!modalProduct}
        title={modalProduct ? `Restock — ${modalProduct.name}` : 'Restock'}
        onClose={() => {
          setModalProduct(null)
          setNewStock('')
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => {
                setModalProduct(null)
                setNewStock('')
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-xl"
              disabled={
                restockM.isPending ||
                !modalProduct ||
                Number.isNaN(Number(newStock))
              }
              onClick={() => restockM.mutate()}
            >
              {restockM.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              Update stock
            </button>
          </>
        }
      >
        {modalProduct ? (
          <div className="space-y-3">
            <p className="text-sm text-base-content/70">
              Current: <strong>{modalProduct.stock}</strong> · Minimum:{' '}
              <strong>{modalProduct.minThreshold}</strong>
            </p>
            <label className="form-control w-full">
              <span className="label-text font-medium">New stock level</span>
              <input
                type="number"
                min={0}
                className="input input-bordered rounded-xl"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </AppModal>
    </DashboardLayout>
  )
}
