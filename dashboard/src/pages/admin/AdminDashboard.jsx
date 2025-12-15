import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [hosts, setHosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [dashRes, hostsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch(`${API_BASE}/admin/hosts?limit=50`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ])

      if (dashRes.status === 401 || hostsRes.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      const dashData = await dashRes.json()
      const hostsData = await hostsRes.json()

      if (!dashRes.ok) throw new Error(dashData.error)
      if (!hostsRes.ok) throw new Error(hostsData.error)

      setStats(dashData.stats)
      setHosts(hostsData.hosts || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function searchHosts() {
    try {
      const res = await fetch(`${API_BASE}/admin/hosts?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()
      setHosts(data.hosts || [])
    } catch (err) {
      setError(err.message)
    }
  }

  function logout() {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">CopyBot Admin</h1>
          <button onClick={logout} className="text-red-400 hover:text-red-300">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded mb-6">{error}</div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Users" value={stats.total_users} />
            <StatCard label="Total Hosts" value={stats.total_hosts} />
            <StatCard label="Active Hosts" value={stats.active_hosts} />
            <StatCard label="Total Subscribers" value={stats.total_subscribers} />
            <StatCard label="Active Subscribers" value={stats.active_subscribers} />
            <StatCard label="Total Signals" value={stats.total_signals} />
            <StatCard label="Signals (24h)" value={stats.signals_24h} />
            <StatCard label="Executed Trades" value={stats.executed_deliveries} />
          </div>
        )}

        {/* Hosts Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Hosts</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchHosts()}
                placeholder="Search by name or email..."
                className="bg-gray-700 px-3 py-2 rounded text-sm w-64"
              />
              <button
                onClick={searchHosts}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Subscribers</th>
                  <th className="pb-3">Signals</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map(host => (
                  <tr key={host.id} className="border-b border-gray-700/50">
                    <td className="py-3">{host.id}</td>
                    <td className="py-3">{host.name}</td>
                    <td className="py-3 text-gray-400">{host.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        host.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                        host.plan === 'pro' ? 'bg-blue-900 text-blue-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {host.plan}
                      </span>
                    </td>
                    <td className="py-3">{host.subscriber_count}</td>
                    <td className="py-3">{host.signal_count}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        host.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {host.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(host.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/admin/hosts/${host.id}`)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hosts.length === 0 && (
            <div className="text-center text-gray-500 py-8">No hosts found</div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="text-2xl font-bold">{value || 0}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  )
}
