type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="text-sm text-base-content/60">
        Showing{' '}
        <span className="font-medium text-base-content">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}
        </span>
        –
        <span className="font-medium text-base-content">
          {Math.min(page * pageSize, total)}
        </span>{' '}
        of <span className="font-medium text-base-content">{total}</span>
      </p>
      <div className="join border border-base-300 bg-base-100 shadow-sm">
        <button
          type="button"
          className="btn btn-sm join-item border-0 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-primary hover:text-white disabled:bg-slate-200 disabled:text-slate-500"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button type="button" className="btn btn-sm join-item no-animation pointer-events-none border-x border-base-300 bg-slate-100 px-4 text-sm font-medium text-slate-800">
          Page {page} / {totalPages}
        </button>
        <button
          type="button"
          className="btn btn-sm join-item border-0 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-primary hover:text-white disabled:bg-slate-200 disabled:text-slate-500"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
