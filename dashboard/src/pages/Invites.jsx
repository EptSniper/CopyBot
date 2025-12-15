import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Invites() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', maxUses: '', expiresInDays: '' })
  const [creating, setCreating] = useState(false)

  const dashboardUrl = window.location.origin

  useEffect(() => {
    fetchInvites()
  }, [])

  async function fetchInvites() {
    try {
      const data = await api.get('/invite')
      setInvites(data.codes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createInvite(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/invite', {
        name: form.name || null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresInDays: form.expiresInDays ? parseInt(form.expiresInDays) : null
      })
      setForm({ name: '', maxUses: '', expiresInDays: '' })
      setShowCreate(false)
      fetchInvites()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function deleteInvite(id) {
    if (!confirm('Delete this invite code?')) return
    try {
      await api.delete(`/invite/${id}`)
      fetchInvites()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleInvite(id, active) {
    try {
      await api.patch(`/invite/${id}`, { active: !active })
      fetchInvites()
    } catch (err) {
      setError(err.message)
    }
  }

  function copyLink(code) {
    navigator.clipboard.writeText(`${dashboardUrl}/join/${code}`)
    alert('Link copied!')
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invite Links</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          + Create Invite
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">{error}</div>
      )}

      {showCreate && (
        <form onSubmit={createInvite} className="bg-gray-800 p-4 rounded-lg mb-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Label (optional)</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-700 p-2 rounded"
              placeholder="e.g., Discord Promo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => setForm({ ...form, maxUses: e.target.value })}
                className="w-full bg-gray-700 p-2 rounded"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Expires in Days (blank = never)</label>
              <input
                type="number"
                value={form.expiresInDays}
                onChange={e => setForm({ ...form, expiresInDays: e.target.value })}
                className="w-full bg-gray-700 p-2 rounded"
                placeholder="30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {invites.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No invite links yet. Create one to let subscribers join!
          </div>
        ) : (
          invites.map(invite => (
            <div key={invite.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-400">{invite.code}</span>
                    {invite.name && (
                      <span className="text-gray-400">({invite.name})</span>
                    )}
                    {!invite.active && (
                      <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded">Disabled</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {invite.uses} uses
                    {invite.max_uses && ` / ${invite.max_uses} max`}
                    {invite.expires_at && ` • Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(invite.code)}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => toggleInvite(invite.id, invite.active)}
                    className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                  >
                    {invite.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteInvite(invite.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
