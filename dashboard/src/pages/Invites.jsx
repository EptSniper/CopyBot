import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Card, CardContent, Button, Input, Badge, useToast, SkeletonCard } from '../components/ui'

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

  const toast = useToast()

  function copyLink(code) {
    navigator.clipboard.writeText(`${dashboardUrl}/join/${code}`)
    toast.success('Invite link copied!')
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-surface-700/50 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-surface-700/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Invite Links</h1>
          <p className="text-surface-400 mt-1">Create and manage subscriber invite links</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          + Create Invite
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {showCreate && (
        <Card>
          <CardContent>
            <form onSubmit={createInvite} className="space-y-4">
              <Input
                label="Label (optional)"
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Discord Promo"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Uses (blank = unlimited)"
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="100"
                />
                <Input
                  label="Expires in Days (blank = never)"
                  type="number"
                  value={form.expiresInDays}
                  onChange={e => setForm({ ...form, expiresInDays: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="success" loading={creating}>
                  Create
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {invites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">🔗</div>
              <p className="text-surface-300 mb-2">No invite links yet</p>
              <p className="text-sm text-surface-500">Create one to let subscribers join!</p>
            </CardContent>
          </Card>
        ) : (
          invites.map(invite => (
            <Card key={invite.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary-400">{invite.code}</span>
                      {invite.name && (
                        <span className="text-surface-400">({invite.name})</span>
                      )}
                      {!invite.active && (
                        <Badge variant="danger" size="sm">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-surface-500 mt-1">
                      {invite.uses} uses
                      {invite.max_uses && ` / ${invite.max_uses} max`}
                      {invite.expires_at && ` • Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => copyLink(invite.code)}>
                      Copy Link
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => toggleInvite(invite.id, invite.active)}>
                      {invite.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => deleteInvite(invite.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
