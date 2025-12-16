import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Badge, Button, SkeletonCard } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminSystemHealth() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 10000) // Auto-refresh every 10s
    return () => clearInterval(interval)
  }, [])

  async function fetchHealth() {
    try {
      const res = await fetch(`${API_BASE}/admin/health`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const data = await res.json()
      setHealth(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'online' || status === 'connected' || status === 'running') return 'success'
    if (status === 'degraded') return 'warning'
    return 'danger'
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
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
            <h1 className="text-xl font-bold">System Health</h1>
          </div>
          <Button onClick={fetchHealth} variant="secondary" size="sm">Refresh</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>
        )}

        {/* Overall Status */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                  health?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <h2 className="text-2xl font-bold text-white capitalize">{health?.status || 'Unknown'}</h2>
                  <p className="text-surface-400">Last checked: {new Date(health?.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              <Badge variant={getStatusColor(health?.status)} size="lg">{health?.status?.toUpperCase()}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="API Status" 
            value={health?.api?.status || 'Unknown'} 
            color={getStatusColor(health?.api?.status)}
            icon="🌐"
          />
          <StatCard 
            label="Uptime" 
            value={formatUptime(health?.api?.uptime || 0)} 
            icon="⏱️"
          />
          <StatCard 
            label="Node Version" 
            value={health?.api?.nodeVersion || 'N/A'} 
            icon="📦"
          />
          <StatCard 
            label="API Version" 
            value={health?.api?.version || '1.0.0'} 
            icon="🏷️"
          />
        </div>

        {/* Database Status */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">🗄️ Database</CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-800/50 p-4 rounded-lg">
                <p className="text-surface-400 text-sm">Status</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${health?.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {health?.database?.status || 'Unknown'}
                </p>
              </div>
              <div className="bg-surface-800/50 p-4 rounded-lg">
                <p className="text-surface-400 text-sm">Latency</p>
                <p className={`text-xl font-bold ${health?.database?.latency > 100 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {health?.database?.latency || 0}ms
                </p>
              </div>
              <div className="bg-surface-800/50 p-4 rounded-lg">
                <p className="text-surface-400 text-sm">Pool Total</p>
                <p className="text-xl font-bold text-white">{health?.database?.pool?.total || 0}</p>
              </div>
              <div className="bg-surface-800/50 p-4 rounded-lg">
                <p className="text-surface-400 text-sm">Pool Idle</p>
                <p className="text-xl font-bold text-white">{health?.database?.pool?.idle || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WebSocket & Memory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <CardTitle className="mb-4">🔌 WebSocket</CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Status</p>
                  <p className="text-xl font-bold text-emerald-400">{health?.websocket?.status || 'Unknown'}</p>
                </div>
                <div className="bg-surface-800/50 p-4 rounded-lg">
                  <p className="text-surface-400 text-sm">Connections</p>
                  <p className="text-xl font-bold text-white">{health?.websocket?.connections || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CardTitle className="mb-4">💾 Memory</CardTitle>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-400">Heap Usage</span>
                    <span className="text-white">{health?.memory?.percentage || 0}%</span>
                  </div>
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        health?.memory?.percentage > 80 ? 'bg-red-500' :
                        health?.memory?.percentage > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${health?.memory?.percentage || 0}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-surface-400">Used</p>
                    <p className="text-white font-medium">{formatBytes(health?.memory?.used)}</p>
                  </div>
                  <div>
                    <p className="text-surface-400">Total</p>
                    <p className="text-white font-medium">{formatBytes(health?.memory?.total)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
