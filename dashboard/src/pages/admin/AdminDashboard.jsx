import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Button, Input, Badge } from '../../components/ui'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-red-500/20">
              🔐
            </div>
            <h1 className="text-xl font-bold">CopyBot Admin</h1>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.total_users} icon="👤" />
            <StatCard label="Total Hosts" value={stats.total_hosts} icon="🏠" />
            <StatCard label="Active Hosts" value={stats.active_hosts} color="green" icon="✓" />
            <StatCard label="Total Subscribers" value={stats.total_subscribers} icon="👥" />
            <StatCard label="Active Subscribers" value={stats.active_subscribers} color="green" icon="✓" />
            <StatCard label="Total Signals" value={stats.total_signals} icon="📡" />
            <StatCard label="Signals (24h)" value={stats.signals_24h} icon="📊" />
            <StatCard label="Executed Trades" value={stats.executed_deliveries} color="blue" icon="🎯" />
          </div>
        )}

        {/* Hosts Section */}
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Hosts</CardTitle>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchHosts()}
                  placeholder="Search by name or email..."
                  className="w-64"
                />
                <Button onClick={searchHosts}>Search</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-400 border-b border-surface-700/50">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Subscribers</th>
                    <th className="pb-3 font-medium">Signals</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map(host => (
                    <tr key={host.id} className="border-b border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                      <td className="py-3 text-surface-400">{host.id}</td>
                      <td className="py-3 font-medium text-white">{host.name}</td>
                      <td className="py-3 text-surface-400">{host.email}</td>
                      <td className="py-3">
                        <Badge variant={
                          host.plan === 'enterprise' ? 'purple' :
                          host.plan === 'pro' ? 'primary' : 'neutral'
                        }>
                          {host.plan}
                        </Badge>
                      </td>
                      <td className="py-3 text-surface-300">{host.subscriber_count}</td>
                      <td className="py-3 text-surface-300">{host.signal_count}</td>
                      <td className="py-3">
                        <Badge variant={host.active ? 'success' : 'danger'}>
                          {host.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-surface-400">
                        {new Date(host.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => navigate(`/admin/hosts/${host.id}`)}
                          className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
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
              <div className="text-center text-surface-500 py-8">No hosts found</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
