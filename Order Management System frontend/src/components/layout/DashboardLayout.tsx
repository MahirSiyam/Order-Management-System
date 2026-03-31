import { useState, type ReactNode } from 'react'
import { useAppUser } from '../../hooks/useAppUser'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type Props = {
  title: string
  children: ReactNode
  searchSlot?: ReactNode
}

export function DashboardLayout({ title, children, searchSlot }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { displayRole } = useAppUser()

  return (
    <div className="min-h-screen bg-base-100">
      <div className="drawer lg:drawer-open">
        <input
          id="app-drawer"
          type="checkbox"
          className="drawer-toggle"
          aria-label="Toggle navigation"
          checked={drawerOpen}
          onChange={(e) => setDrawerOpen(e.target.checked)}
        />
        <div className="drawer-content flex min-h-screen flex-col">
          <TopBar
            title={title}
            onMenuClick={() => setDrawerOpen(true)}
            searchSlot={searchSlot}
            appRole={displayRole}
          />
          <main className="flex-1 bg-base-100 p-4 lg:p-8">{children}</main>
        </div>
        <div className="drawer-side z-50">
          <label
            htmlFor="app-drawer"
            aria-label="close sidebar"
            className="drawer-overlay lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </div>
  )
}
