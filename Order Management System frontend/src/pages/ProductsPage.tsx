import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AppModal } from '../components/ui/AppModal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { PaginationBar } from '../components/ui/PaginationBar'
import { StockBadge } from '../components/ui/StockBadge'
import { useAppUser } from '../hooks/useAppUser'
import { useDebounce } from '../hooks/useDebounce'
import { queryKeys } from '../hooks/queryKeys'
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
} from '../services/api'
import type { ProductStatus } from '../types/models'

export default function ProductsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAppUser()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    stock: '',
    minThreshold: '',
    status: 'Active' as ProductStatus,
  })

  const pageSize = 10
  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
      page,
      pageSize,
    }),
    [debouncedSearch, categoryId, page]
  )

  const catsQ = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  })

  const productsQ = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => fetchProducts(params),
  })

  const createM = useMutation({
    mutationFn: () =>
      createProduct({
        name: form.name,
        categoryId: form.categoryId,
        price: Number(form.price),
        stock: Number(form.stock),
        minThreshold: Number(form.minThreshold),
        status: form.status,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      toast.success('Product created')
      setOpen(false)
      setForm({
        name: '',
        categoryId: '',
        price: '',
        stock: '',
        minThreshold: '',
        status: 'Active',
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      void qc.invalidateQueries({ queryKey: queryKeys.dashboardStats })
      void qc.invalidateQueries({ queryKey: queryKeys.restockQueue })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      void qc.invalidateQueries({ queryKey: queryKeys.chartSeries })
      toast.success('Product deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const catMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of catsQ.data ?? []) m.set(c.id, c.name)
    return m
  }, [catsQ.data])

  const searchSlot = (
    <>
      <input
        type="search"
        className="grow bg-transparent outline-none"
        placeholder="Search products…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />
    </>
  )

  return (
    <DashboardLayout title="Products" searchSlot={searchSlot}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <label className="form-control w-full max-w-xs sm:w-56">
            <span className="label-text px-1 pb-1 text-xs font-medium mb-2">Category</span>
            <select
              className="select select-bordered min-h-10 rounded-xl px-3"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All categories</option>
              {(catsQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary rounded-xl shadow-md"
          onClick={() => {
            setForm((f) => ({
              ...f,
              categoryId: categoryId || (catsQ.data?.[0]?.id ?? ''),
            }))
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      <div className="md:hidden mb-4">
        <label className="input input-bordered flex w-full items-center gap-2 rounded-xl">
          <input
            type="search"
            className="grow"
            placeholder="Search products…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>

      {productsQ.isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-base-200/80">
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Min</th>
                    <th>Status</th>
                    <th>Badge</th>
                    {isAdmin ? <th /> : null}
                  </tr>
                </thead>
                <tbody>
                  {(productsQ.data?.items ?? []).map((p) => (
                    <tr key={p.id} className="hover">
                      <td className="font-medium">{p.name}</td>
                      <td className="text-sm text-base-content/70">
                        {catMap.get(p.categoryId) ?? '—'}
                      </td>
                      <td>${p.price.toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td>{p.minThreshold}</td>
                      <td>
                        <span
                          className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold leading-none ${
                            p.status === 'Active'
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                              : 'border-slate-300 bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.status === 'Active' ? 'Active' : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        <StockBadge product={p} />
                      </td>
                      {isAdmin ? (
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-square btn-sm text-error"
                            aria-label={`Delete ${p.name}`}
                            disabled={deleteM.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete product "${p.name}"? This cannot be undone.`
                                )
                              ) {
                                deleteM.mutate(p.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={productsQ.data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      <AppModal
        open={open}
        title="Add product"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-xl"
              disabled={
                createM.isPending ||
                !form.name.trim() ||
                !form.categoryId ||
                Number.isNaN(Number(form.price)) ||
                Number.isNaN(Number(form.stock)) ||
                Number.isNaN(Number(form.minThreshold))
              }
              onClick={() => createM.mutate()}
            >
              {createM.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              Create
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="form-control w-full">
            <span className="label-text font-medium">Name</span>
            <input
              className="input input-bordered rounded-xl"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text font-medium">Category</span>
            <select
              className="select select-bordered rounded-xl"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
            >
              <option value="" disabled>
                Select category
              </option>
              {(catsQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control w-full">
              <span className="label-text font-medium">Price</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input input-bordered rounded-xl"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium">Stock quantity</span>
              <input
                type="number"
                min={0}
                className="input input-bordered rounded-xl"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
              />
            </label>
          </div>
          <label className="form-control w-full">
            <span className="label-text font-medium">Minimum stock threshold</span>
            <input
              type="number"
              min={0}
              className="input input-bordered rounded-xl"
              value={form.minThreshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, minThreshold: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text font-medium">Status</span>
            <select
              className="select select-bordered rounded-xl"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as ProductStatus,
                }))
              }
            >
              <option value="Active">Active</option>
              <option value="Out of Stock">Out of stock</option>
            </select>
          </label>
        </div>
      </AppModal>
    </DashboardLayout>
  )
}
