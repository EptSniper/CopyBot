import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/subscribers', label: 'Subscribers' },
  { to: '/invites', label: 'Invite Links' },
  { to: '/signals', label: 'Signals' },
  { to: '/settings', label: 'Settings' },
  { to: '/billing', label: 'Billing' },
]

export default function Layout() {
  const { user, host, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">CopyBot</h1>
            <p className="text-sm text-gray-400">{host?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Logout
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded mb-1 ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
