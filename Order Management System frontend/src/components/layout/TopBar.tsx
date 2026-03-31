import { LogOut, Menu, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'

type Props = {
  title: string
  onMenuClick?: () => void
  searchSlot?: ReactNode
  /** Role badge from session / API */
  appRole?: string
}

export function TopBar({ title, onMenuClick, searchSlot, appRole }: Props) {
  const { user, logout } = useAuth()
  const email = user?.email

  return (
    <header className="sticky top-0 z-40 border-b border-base-200 bg-base-100/95 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
        <button
          type="button"
          className="btn btn-square min-h-11 border border-base-300 bg-base-100 text-base-content shadow-sm hover:bg-base-200 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-base-content">
            {title}
          </h1>
          <div className="hidden flex-wrap items-center gap-2 text-sm text-base-content/70 sm:flex">
            <span className="min-w-0 truncate">{email ?? 'Signed in'}</span>
            {appRole ? (
              <span
                className={`inline-flex min-h-7 max-w-full shrink-0 items-center rounded-md border px-2.5 py-1 text-xs font-semibold capitalize leading-none ${
                  appRole === 'admin'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-950'
                    : 'border-sky-200 bg-sky-50 text-sky-950'
                }`}
              >
                {appRole}
              </span>
            ) : null}
          </div>
        </div>
        {searchSlot ? (
          <div className="hidden max-w-md flex-1 md:flex md:items-center md:justify-end">
            <label className="input input-bordered flex min-h-11 w-full max-w-sm items-center gap-2 rounded-xl border-base-300 bg-base-100 px-3 shadow-sm transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
              <Search className="h-4 w-4 shrink-0 text-base-content/45" aria-hidden />
              {searchSlot}
            </label>
          </div>
        ) : null}
        <button
          type="button"
          className="btn min-h-11 shrink-0 gap-2 rounded-xl border border-base-300 bg-base-100 px-4 font-semibold text-base-content shadow-sm transition hover:border-base-400 hover:bg-base-200"
          onClick={() => void logout()}
        >
          <LogOut className="h-4 w-4 shrink-0 text-base-content" aria-hidden />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
