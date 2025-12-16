import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Badge, Button, Select, SkeletonCard } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminDeliveryStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(7)
  const navigate = useNavigate()
  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchStats()
  }, [days])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/delivery-stats?days=${days}`, {
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

  if (loading && !stats) {
    return (
      <div className="min-h-screen text-white">
        <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-10 w-48 bg-surface-700/50 rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
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
            <h1 className="text-xl font-bold">Delivery Statistics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={days} onChange={e => setDays(parseInt(e.target.value))}>
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </Select>
            <Button onClick={fetchStats} variant="secondary" size="sm">Refresh</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>
        )}

        {/* Success Rate Banner */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-400 text-sm">Delivery Success Rate ({stats?.period})</p>
                <p className={`text-4xl font-bold ${stats?.successRate >= 90 ? 'text-emerald-400' : stats?.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats?.successRate || 0}%
                </p>
              </div>
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                stats?.successRate >= 90 ? 'border-emerald-500' : stats?.successRate >= 70 ? 'border-yellow-500' : 'border-red-500'
              }`}>
                <span className="text-2xl">{stats?.successRate >= 90 ? '✓' : stats?.successRate >= 70 ? '⚠' : '✗'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signal Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Signals" value={stats?.signals?.total || 0} icon="📡" />
          <StatCard label="Delivered" value={stats?.signals?.delivered || 0} color="green" icon="✓" />
          <StatCard label="Pending" value={stats?.signals?.pending || 0} color="yellow" icon="⏳" />
          <StatCard label="Failed" value={stats?.signals?.failed || 0} color="red" icon="✗" />
          <StatCard label="Skipped" value={stats?.signals?.skipped || 0} color="neutral" icon="⏭️" />
        </div>

        {/* Webhook Stats & Latency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <CardTitle className="mb-4">🔗 Webhook Deliveries</CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{stats?.webhooks?.total || 0}</p>
                </div>
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Success</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats?.webhooks?.success || 0}</p>
                </div>
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.webhooks?.failed || 0}</p>
                </div>
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Retries</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.webhooks?.retries || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CardTitle className="mb-4">⚡ Performance</CardTitle>
              <div className="bg-surface-800/50 p-6 rounded-lg text-center">
                <p className="text-surface-400 text-sm mb-2">Average Delivery Latency</p>
                <p className={`text-4xl font-bold ${
                  stats?.avgLatency < 100 ? 'text-emerald-400' : 
                  stats?.avgLatency < 500 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {stats?.avgLatency || 0}ms
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Breakdown */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">❌ Error Breakdown</CardTitle>
            {stats?.errorBreakdown?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-surface-400 border-b border-surface-700/50">
                      <th className="pb-3 font-medium">Error</th>
                      <th className="pb-3 font-medium">Count</th>
                      <th className="pb-3 font-medium">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.errorBreakdown.map((err, i) => {
                      const total = stats.errorBreakdown.reduce((sum, e) => sum + parseInt(e.count), 0)
                      const pct = total > 0 ? ((parseInt(err.count) / total) * 100).toFixed(1) : 0
                      return (
                        <tr key={i} className="border-b border-surface-700/30">
                          <td className="py-3 text-white">{err.error || 'Unknown'}</td>
                          <td className="py-3 text-surface-300">{err.count}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-surface-700 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-surface-400">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-500 text-center py-8">No errors recorded 🎉</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
