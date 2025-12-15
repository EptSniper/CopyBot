import { useState, useEffect } from 'react'
import api from '../lib/api'

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

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <button
          onClick={() => { setEditingSub(null); setForm({ name: '', email: '', webhook_url: '' }); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Subscriber
        </button>
      </div>

      {subscribers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No subscribers yet</p>
          <p className="text-sm text-gray-400">Add your first subscriber to start distributing signals</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">API Key</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Deliveries</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{sub.name}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code 
                      className="text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => { navigator.clipboard.writeText(sub.api_key); alert('API Key copied!'); }}
                      title="Click to copy full key"
                    >
                      {sub.api_key?.slice(0, 20)}... 📋
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sub.executed_deliveries || 0} / {sub.total_deliveries || 0}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(sub)} className="text-blue-600 hover:underline text-sm mr-3">Edit</button>
                    <button onClick={() => toggleStatus(sub)} className="text-yellow-600 hover:underline text-sm mr-3">
                      {sub.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingSub ? 'Edit Subscriber' : 'Add Subscriber'}</h2>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Webhook URL (optional)</label>
                <input
                  type="url"
                  value={form.webhook_url}
                  onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Signals will be POSTed to this URL</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingSub ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
