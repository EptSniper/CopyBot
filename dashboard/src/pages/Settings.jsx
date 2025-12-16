import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import api from '../lib/api'
import { Card, CardContent, CardTitle, Button, Input, useToast } from '../components/ui'

export default function Settings() {
  const { host, updateHost } = useAuthStore()
  const [name, setName] = useState(host?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showKey, setShowKey] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  
  const [whopApiKey, setWhopApiKey] = useState(host?.whop_api_key || '')
  const [whopProductId, setWhopProductId] = useState(host?.whop_product_id || '')
  const [savingWhop, setSavingWhop] = useState(false)

  const toast = useToast()

  const showMessage = (type, text) => {
    if (type === 'success') toast.success(text)
    else toast.error(text)
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.patch('/host/me', { name })
      updateHost({ ...host, name: updated.name })
      showMessage('success', 'Settings saved!')
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateKey = async () => {
    if (!confirm('Regenerate API key? Your Discord bot will need to be updated with the new key.')) return
    setRegenerating(true)
    try {
      const { api_key } = await api.post('/host/me/regenerate-key')
      updateHost({ ...host, api_key })
      showMessage('success', 'API key regenerated!')
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setRegenerating(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showMessage('success', 'Copied to clipboard!')
  }

  const handleSaveWhop = async (e) => {
    e.preventDefault()
    setSavingWhop(true)
    try {
      const result = await api.patch('/host/whop-settings', {
        whop_api_key: whopApiKey,
        whop_product_id: whopProductId
      })
      updateHost({ ...host, whop_api_key: whopApiKey, whop_product_id: whopProductId, slug: result.slug })
      showMessage('success', 'Whop settings saved!')
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setSavingWhop(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-surface-400 mt-1">Manage your account and integrations</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile settings */}
      <Card>
        <CardContent>
          <CardTitle className="mb-4">Profile</CardTitle>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="max-w-md">
              <Input
                label="Business Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardContent>
          <CardTitle className="mb-2">API Key</CardTitle>
          <p className="text-sm text-surface-400 mb-4">
            Use this key to authenticate your Discord bot with the backend.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 bg-surface-900 p-3 rounded-lg text-sm break-all text-emerald-400 border border-surface-700/50">
              {showKey ? host?.api_key : '••••••••••••••••••••••••••••••••'}
            </code>
            <Button variant="secondary" size="sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(host?.api_key)}>
              Copy
            </Button>
          </div>
          <button
            onClick={handleRegenerateKey}
            disabled={regenerating}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
          </button>
        </CardContent>
      </Card>

      {/* Whop Integration */}
      <Card>
        <CardContent>
          <CardTitle className="mb-2">Whop Integration</CardTitle>
          <p className="text-sm text-surface-400 mb-4">
            Connect your Whop store to let customers activate their subscriptions automatically.
          </p>
          <form onSubmit={handleSaveWhop} className="space-y-4">
            <div className="max-w-md">
              <Input
                label="Whop API Key"
                type="password"
                value={whopApiKey}
                onChange={(e) => setWhopApiKey(e.target.value)}
                placeholder="whop_xxxxx..."
              />
              <p className="text-xs text-surface-500 mt-1">
                Get this from your Whop dashboard → Settings → API
              </p>
            </div>
            <div className="max-w-md">
              <Input
                label="Product ID (optional)"
                type="text"
                value={whopProductId}
                onChange={(e) => setWhopProductId(e.target.value)}
                placeholder="prod_xxxxx"
              />
            </div>
            <Button type="submit" loading={savingWhop}>
              Save Whop Settings
            </Button>
          </form>
          
          {host?.slug && (
            <div className="mt-6 p-4 bg-surface-900/50 rounded-lg border border-surface-700/50">
              <p className="text-sm text-surface-300 mb-2">Your activation URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-900 p-2 rounded-lg text-emerald-400 text-sm border border-surface-700/50">
                  {window.location.origin}/activate/{host.slug}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(`${window.location.origin}/activate/${host.slug}`)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-surface-500 mt-2">
                Share this link with customers after they purchase on Whop
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Bot Setup */}
      <Card>
        <CardContent>
          <CardTitle className="mb-2">Discord Bot Setup</CardTitle>
          <p className="text-sm text-surface-400 mb-4">
            Configure your Discord bot with these environment variables:
          </p>
          <div className="bg-surface-900 text-emerald-400 p-4 rounded-lg font-mono text-sm border border-surface-700/50">
            <p>DISCORD_TOKEN=your_discord_bot_token</p>
            <p>BACKEND_URL=https://your-api-url.com/signals</p>
            <p>BACKEND_API_KEY={host?.api_key?.slice(0, 20)}...</p>
            <p>COMMAND_GUILD_ID=your_guild_id</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
