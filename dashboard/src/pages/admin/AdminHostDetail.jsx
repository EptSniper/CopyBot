import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Host not found</div>
      </div>
    )
  }

  const { host, subscribers, recentSignals, stats } = data

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white">
              ← Back
            </button>
            <h1 className="text-xl font-bold">Host: {host.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded">{error}</div>
        )}

        {/* Host Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Host Details</h2>
            <button
              onClick={() => editing ? saveChanges() : setEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Name</label>
              {editing ? (
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded mt-1"
                />
              ) : (
                <div className="font-medium">{host.name}</div>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <div className="font-medium">{host.email}</div>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Plan</label>
              {editing ? (
                <select
                  value={form.plan}
                  onChange={e => setForm({ ...form, plan: e.target.value })}
                  className="w-full bg-gray-700 p-2 rounded mt-1"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              ) : (
                <div className="font-medium">{host.plan}</div>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-sm">Subscriber Limit</label>
              {editing ? (
                <input
                  type="number"
                  value={form.subscriber_limit}
                  onChange={e => setForm({ ...form, subscriber_limit: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 p-2 rounded mt-1"
                />
              ) : (
                <div className="font-medium">{host.subscriber_limit}</div>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-sm">Status</label>
              {editing ? (
                <select
                  value={form.active ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, active: e.target.value === 'true' })}
                  className="w-full bg-gray-700 p-2 rounded mt-1"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              ) : (
                <div className={host.active ? 'text-green-400' : 'text-red-400'}>
                  {host.active ? 'Active' : 'Inactive'}
                </div>
              )}
            </div>
            <div>
              <label className="text-gray-400 text-sm">API Key</label>
              <div className="font-mono text-xs text-blue-400 break-all">{host.api_key}</div>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Created</label>
              <div>{new Date(host.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold">{stats.total_subscribers}</div>
            <div className="text-gray-400 text-sm">Total Subscribers</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold">{stats.active_subscribers}</div>
            <div className="text-gray-400 text-sm">Active Subscribers</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold">{stats.total_signals}</div>
            <div className="text-gray-400 text-sm">Total Signals</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold">{stats.executed_deliveries}</div>
            <div className="text-gray-400 text-sm">Executed Trades</div>
          </div>
        </div>

        {/* Subscribers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Subscribers ({subscribers.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">API Key</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-700/50">
                    <td className="py-3">{sub.id}</td>
                    <td className="py-3">{sub.name}</td>
                    <td className="py-3 text-gray-400">{sub.email || '-'}</td>
                    <td className="py-3 font-mono text-xs text-blue-400">{sub.api_key}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        sub.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Signals */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Signals</h2>
          <div className="space-y-2">
            {recentSignals.map(signal => (
              <div key={signal.id} className="bg-gray-900 p-3 rounded text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">#{signal.id}</span>
                  <span className="text-gray-500">{new Date(signal.created_at).toLocaleString()}</span>
                </div>
                <pre className="text-xs text-gray-300 mt-1 overflow-x-auto">
                  {JSON.stringify(signal.payload, null, 2)}
                </pre>
              </div>
            ))}
            {recentSignals.length === 0 && (
              <div className="text-gray-500 text-center py-4">No signals yet</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
