import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  ClipboardList,
  RefreshCw,
  Users,
  ScrollText,
  UserCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppUser } from '../../hooks/useAppUser'
import { InventraXWordmark } from '../ui/InventraXWordmark'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const profileLink: NavItem = {
  to: '/profile',
  label: 'My profile',
  icon: UserCircle,
}

const staffCore: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, end: true },
  { to: '/orders/new', label: 'New order', icon: ClipboardList },
  { to: '/restock', label: 'Restock queue', icon: RefreshCw },
  { to: '/activity', label: 'Activity logs', icon: ScrollText },
]

const manageUsers: NavItem = {
  to: '/users',
  label: 'Manage users',
  icon: Users,
}

const customerLinks: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'My orders', icon: ShoppingCart, end: true },
  { to: '/orders/new', label: 'Create order', icon: ClipboardList },
  profileLink,
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isCustomer, isAdmin } = useAppUser()

  const links: NavItem[] = isCustomer
    ? customerLinks
    : [
        ...staffCore,
        ...(isAdmin ? [manageUsers] : []),
        profileLink,
      ]

  return (
    <aside className="flex h-full w-64 flex-col border-r border-base-200 bg-base-100 shadow-sm">
      <div className="border-b border-base-200 px-5 py-6">
        <InventraXWordmark inheritText />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/12 font-semibold text-primary'
                  : 'text-base-content/80 hover:bg-base-200/90'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-base-200 p-4 text-xs text-base-content/55">
        © {new Date().getFullYear()} Inventory OS
      </div>
    </aside>
  )
}
