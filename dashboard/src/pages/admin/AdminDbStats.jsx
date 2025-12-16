import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Button, SkeletonCard } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminDbStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/admin/db-stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const data = await res.json()
      setStats(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-10 w-48 bg-surface-700/50 rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-surface-400 hover:text-white transition-colors">← Back</Link>
            <h1 className="text-xl font-bold">Database Statistics</h1>
          </div>
          <Button onClick={fetchStats} variant="secondary" size="sm">Refresh</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Database Size" value={stats?.totalSize || 'N/A'} icon="💾" />
          <StatCard label="Active Connections" value={stats?.connections?.active || 0} color="green" icon="🔌" />
          <StatCard label="Total Connections" value={stats?.connections?.total || 0} icon="📊" />
        </div>

        {/* Connection Pool */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">🔌 Connection Pool</CardTitle>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-800/50 p-4 rounded-lg text-center">
                <p className="text-surface-400 text-sm">Active</p>
                <p className="text-3xl font-bold text-emerald-400">{stats?.connections?.active || 0}</p>
              </div>
              <div className="bg-surface-800/50 p-4 rounded-lg text-center">
                <p className="text-surface-400 text-sm">Idle</p>
                <p className="text-3xl font-bold text-yellow-400">{stats?.connections?.idle || 0}</p>
              </div>
              <div className="bg-surface-800/50 p-4 rounded-lg text-center">
                <p className="text-surface-400 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">{stats?.connections?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Sizes */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">📋 Table Row Counts</CardTitle>
            {stats?.tables?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-surface-400 border-b border-surface-700/50">
                      <th className="pb-3 font-medium">Table</th>
                      <th className="pb-3 font-medium text-right">Rows</th>
                      <th className="pb-3 font-medium">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.tables.map((table, i) => {
                      const maxRows = Math.max(...stats.tables.map(t => t.rows))
                      const pct = maxRows > 0 ? (table.rows / maxRows) * 100 : 0
                      return (
                        <tr key={i} className="border-b border-surface-700/30">
                          <td className="py-3 font-mono text-white">{table.name}</td>
                          <td className="py-3 text-surface-300 text-right">{table.rows.toLocaleString()}</td>
                          <td className="py-3">
                            <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary-500 rounded-full transition-all" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-500 text-center py-8">No table data available</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
