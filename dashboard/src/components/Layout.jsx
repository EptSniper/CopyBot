import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Button } from './ui'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/subscribers', label: 'Subscribers', icon: '👥' },
  { to: '/invites', label: 'Invite Links', icon: '🔗' },
  { to: '/signals', label: 'Signals', icon: '📡' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/billing', label: 'Billing', icon: '💳' },
]

export default function Layout() {
  const { user, host, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-surface-950">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface-800/90 backdrop-blur-sm rounded-lg text-white border border-surface-700/50 hover:bg-surface-700 transition-colors"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-surface-900/95 backdrop-blur-md text-white flex flex-col h-full
        border-r border-surface-800
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo area */}
        <div className="p-5 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                CopyBot
              </h1>
              <p className="text-xs text-surface-400 truncate max-w-[140px]">{host?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary-500/10 text-white' 
                    : 'text-surface-400 hover:bg-surface-800/50 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full" />
                    )}
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.email}</p>
              <p className="text-xs text-surface-500">Host Account</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-16 md:pt-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
