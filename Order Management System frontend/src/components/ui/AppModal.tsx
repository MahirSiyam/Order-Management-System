import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function AppModal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null
  return (
    <dialog className="modal modal-open z-50">
      <div className="modal-box max-w-lg rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-base-200 px-6 py-4">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-base-200 bg-base-200/40 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
      <form method="dialog" className="modal-backdrop bg-neutral/40">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  )
}
