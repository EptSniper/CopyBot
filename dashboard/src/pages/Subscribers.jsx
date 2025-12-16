import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Card, CardContent, Button, Input, Badge } from '../components/ui'

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', webhook_url: '' })
  const [error, setError] = useState('')

  const loadSubscribers = () => {
    api.get('/host/subscribers').then(setSubscribers).finally(() => setLoading(false))
  }

  useEffect(() => { loadSubscribers() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingSub) {
        await api.patch(`/host/subscribers/${editingSub.id}`, form)
      } else {
        await api.post('/host/subscribers', form)
      }
      setShowModal(false)
      setEditingSub(null)
      setForm({ name: '', email: '', webhook_url: '' })
      loadSubscribers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (sub) => {
    setEditingSub(sub)
    setForm({ name: sub.name, email: sub.email || '', webhook_url: sub.webhook_url || '' })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subscriber?')) return
    await api.delete(`/host/subscribers/${id}`)
    loadSubscribers()
  }

  const toggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'inactive' : 'active'
    await api.patch(`/host/subscribers/${sub.id}`, { status: newStatus })
    loadSubscribers()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscribers</h1>
          <p className="text-surface-400 mt-1">Manage your signal subscribers</p>
        </div>
        <Button onClick={() => { setEditingSub(null); setForm({ name: '', email: '', webhook_url: '' }); setShowModal(true) }}>
          Add Subscriber
        </Button>
      </div>

      {subscribers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-surface-300 mb-2">No subscribers yet</p>
            <p className="text-sm text-surface-500">Add your first subscriber to start distributing signals</p>
          </CardContent>
        </Card>
      ) : (
        <Card hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Source</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">API Key</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Deliveries</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-t border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{sub.name}</td>
                    <td className="px-4 py-3 text-surface-400">{sub.email || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        sub.activated_via === 'whop' ? 'purple' :
                        sub.activated_via === 'invite' ? 'info' : 'neutral'
                      }>
                        {sub.activated_via || 'manual'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sub.status === 'active' ? 'success' : 'neutral'}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <code 
                        className="text-xs bg-surface-900 text-primary-400 px-2 py-1 rounded cursor-pointer hover:bg-surface-800 transition-colors"
                        onClick={() => { navigator.clipboard.writeText(sub.api_key); alert('API Key copied!'); }}
                        title="Click to copy full key"
                      >
                        {sub.api_key?.slice(0, 20)}... 📋
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-400">
                      <span className="text-emerald-400">{sub.executed_deliveries || 0}</span>
                      <span className="text-surface-500"> / {sub.total_deliveries || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(sub)} className="text-primary-400 hover:text-primary-300 text-sm transition-colors">Edit</button>
                        <button onClick={() => toggleStatus(sub)} className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
                          {sub.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-300 text-sm transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-full max-w-md mx-4" hover={false}>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6 text-white">{editingSub ? 'Edit Subscriber' : 'Add Subscriber'}</h2>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <div>
                  <Input
                    label="Webhook URL (optional)"
                    type="url"
                    value={form.webhook_url}
                    onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-surface-500 mt-1">Signals will be POSTed to this URL</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingSub ? 'Save' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
