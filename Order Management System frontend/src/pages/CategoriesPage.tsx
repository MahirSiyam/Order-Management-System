import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { FolderPlus } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AppModal } from '../components/ui/AppModal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { queryKeys } from '../hooks/queryKeys'
import { createCategory, fetchCategories } from '../services/api'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const listQ = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
  })

  const createM = useMutation({
    mutationFn: (n: string) => createCategory(n),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories })
      void qc.invalidateQueries({ queryKey: queryKeys.activities })
      toast.success('Category added')
      setOpen(false)
      setName('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DashboardLayout title="Categories">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base-content/70">
          Organize products with clear category labels.
        </p>
        <button
          type="button"
          className="btn btn-primary rounded-xl shadow-md"
          onClick={() => setOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          Add category
        </button>
      </div>

      {listQ.isLoading ? (
        <PageLoader />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-base-200/80">
                <tr>
                  <th>Name</th>
                  <th className="hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {(listQ.data ?? []).map((c) => (
                  <tr key={c.id} className="hover">
                    <td className="font-medium">{c.name}</td>
                    <td className="hidden text-sm text-base-content/60 sm:table-cell">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AppModal
        open={open}
        title="New category"
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
              disabled={!name.trim() || createM.isPending}
              onClick={() => createM.mutate(name)}
            >
              {createM.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              Save
            </button>
          </>
        }
      >
        <label className="form-control w-full">
          <span className="label-text font-medium">Category name</span>
          <input
            className="input input-bordered rounded-xl"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Electronics"
          />
        </label>
      </AppModal>
    </DashboardLayout>
  )
}
