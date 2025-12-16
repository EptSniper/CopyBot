import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Button, Input, Select, Badge } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminHostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchHost()
  }, [id])

  async function fetchHost() {
    try {
      const res = await fetch(`${API_BASE}/admin/hosts/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
      setForm({
        name: json.host.name,
        plan: json.host.plan,
        subscriber_limit: json.host.subscriber_limit,
        active: json.host.active
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveChanges() {
    try {
      const res = await fetch(`${API_BASE}/admin/hosts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEditing(false)
      fetchHost()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-red-400">Host not found</div>
      </div>
    )
  }

  const { host, subscribers, recentSignals, stats } = data

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-surface-400 hover:text-white transition-colors">
              ← Back
            </button>
            <h1 className="text-xl font-bold">Host: {host.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Host Info */}
        <Card>
          <CardContent>
            <div className="flex justify-between items-start mb-4">
              <CardTitle>Host Details</CardTitle>
              <Button onClick={() => editing ? saveChanges() : setEditing(true)}>
                {editing ? 'Save' : 'Edit'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-surface-400 text-sm">Name</label>
                {editing ? (
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="font-medium text-white">{host.name}</div>
                )}
              </div>
              <div>
                <label className="text-surface-400 text-sm">Email</label>
                <div className="font-medium text-white">{host.email}</div>
              </div>
              <div>
                <label className="text-surface-400 text-sm">Plan</label>
                {editing ? (
                  <Select
                    value={form.plan}
                    onChange={e => setForm({ ...form, plan: e.target.value })}
                    className="mt-1"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </Select>
                ) : (
                  <div className="font-medium text-white">{host.plan}</div>
                )}
              </div>
              <div>
                <label className="text-surface-400 text-sm">Subscriber Limit</label>
                {editing ? (
                  <Input
                    type="number"
                    value={form.subscriber_limit}
                    onChange={e => setForm({ ...form, subscriber_limit: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                ) : (
                  <div className="font-medium text-white">{host.subscriber_limit}</div>
                )}
              </div>
              <div>
                <label className="text-surface-400 text-sm">Status</label>
                {editing ? (
                  <Select
                    value={form.active ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, active: e.target.value === 'true' })}
                    className="mt-1"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                ) : (
                  <div className={host.active ? 'text-emerald-400' : 'text-red-400'}>
                    {host.active ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-surface-400 text-sm">API Key</label>
                <div className="font-mono text-xs text-primary-400 break-all">{host.api_key}</div>
              </div>
              <div>
                <label className="text-surface-400 text-sm">Created</label>
                <div className="text-white">{new Date(host.created_at).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Subscribers" value={stats.total_subscribers} icon="👥" />
          <StatCard label="Active Subscribers" value={stats.active_subscribers} color="green" icon="✓" />
          <StatCard label="Total Signals" value={stats.total_signals} icon="📡" />
          <StatCard label="Executed Trades" value={stats.executed_deliveries} color="blue" icon="🎯" />
        </div>

        {/* Subscribers */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Subscribers ({subscribers.length})</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-400 border-b border-surface-700/50">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">API Key</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(sub => (
                    <tr key={sub.id} className="border-b border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                      <td className="py-3 text-surface-400">{sub.id}</td>
                      <td className="py-3 font-medium text-white">{sub.name}</td>
                      <td className="py-3 text-surface-400">{sub.email || '-'}</td>
                      <td className="py-3 font-mono text-xs text-primary-400">{sub.api_key}</td>
                      <td className="py-3">
                        <Badge variant={sub.status === 'active' ? 'success' : 'danger'}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-surface-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Signals */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Recent Signals</CardTitle>
            <div className="space-y-2">
              {recentSignals.map(signal => (
                <div key={signal.id} className="bg-surface-900/50 p-4 rounded-lg border border-surface-700/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">#{signal.id}</span>
                    <span className="text-surface-500">{new Date(signal.created_at).toLocaleString()}</span>
                  </div>
                  <pre className="text-xs text-surface-300 mt-2 overflow-x-auto">
                    {JSON.stringify(signal.payload, null, 2)}
                  </pre>
                </div>
              ))}
              {recentSignals.length === 0 && (
                <div className="text-surface-500 text-center py-4">No signals yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
