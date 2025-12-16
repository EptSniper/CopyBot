import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Badge, Button, SkeletonCard, useToast } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminSecurity() {
  const [security, setSecurity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchSecurity()
    const interval = setInterval(fetchSecurity, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchSecurity() {
    try {
      const res = await fetch(`${API_BASE}/admin/security`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const data = await res.json()
      setSecurity(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function clearRateLimits() {
    if (!confirm('Are you sure you want to clear all rate limits?')) return
    setClearing(true)
    try {
      const res = await fetch(`${API_BASE}/admin/actions/clear-rate-limits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rate limits cleared!')
        fetchSecurity()
      }
    } catch (err) {
      toast.error('Failed to clear rate limits')
    } finally {
      setClearing(false)
    }
  }

  const getRateLimitColor = (current, limit) => {
    const pct = (current / limit) * 100
    if (pct > 80) return 'red'
    if (pct > 50) return 'yellow'
    return 'green'
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
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
            <h1 className="text-xl font-bold">Security Metrics</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={clearRateLimits} variant="danger" size="sm" loading={clearing}>
              Clear Rate Limits
            </Button>
            <Button onClick={fetchSecurity} variant="secondary" size="sm">Refresh</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>
        )}

        {/* Suspicious Activity Alert */}
        {security?.suspiciousActivity && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold">Suspicious Activity Detected</p>
              <p className="text-sm">High number of blocked requests or failed auth attempts</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Blocked (24h)" value={security?.blocked24h || 0} color="red" icon="🚫" />
          <StatCard label="Failed Auth (24h)" value={security?.failedAuth24h || 0} color="yellow" icon="🔐" />
          <StatCard label="Active IPs" value={security?.topIPs?.length || 0} icon="🌐" />
          <StatCard 
            label="Status" 
            value={security?.suspiciousActivity ? 'Alert' : 'Normal'} 
            color={security?.suspiciousActivity ? 'red' : 'green'}
            icon={security?.suspiciousActivity ? '⚠️' : '✓'}
          />
        </div>

        {/* Rate Limits */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">📊 Rate Limits</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['auth', 'api', 'signals'].map(type => {
                const data = security?.rateLimits?.[type] || { current: 0, limit: 100, blocked: 0 }
                const pct = Math.min(100, (data.current / data.limit) * 100)
                return (
                  <div key={type} className="bg-surface-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium capitalize">{type}</span>
                      <Badge variant={data.blocked > 0 ? 'danger' : 'neutral'}>
                        {data.blocked} blocked
                      </Badge>
                    </div>
                    <div className="h-2 bg-surface-700 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-surface-400 text-sm">{data.current} / {data.limit} requests</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top IPs */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">🌐 Top IP Addresses</CardTitle>
            {security?.topIPs?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-surface-400 border-b border-surface-700/50">
                      <th className="pb-3 font-medium">IP Address</th>
                      <th className="pb-3 font-medium">Requests</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {security.topIPs.map((ip, i) => (
                      <tr key={i} className="border-b border-surface-700/30">
                        <td className="py-3 font-mono text-white">{ip.ip}</td>
                        <td className="py-3 text-surface-300">{ip.requests}</td>
                        <td className="py-3">
                          <Badge variant={ip.blocked ? 'danger' : 'success'}>
                            {ip.blocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-500 text-center py-8">No IP data available</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
