import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import api from '../lib/api'

export default function Settings() {
  const { host, updateHost } = useAuthStore()
  const [name, setName] = useState(host?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  
  // Whop settings
  const [whopApiKey, setWhopApiKey] = useState(host?.whop_api_key || '')
  const [whopProductId, setWhopProductId] = useState(host?.whop_product_id || '')
  const [savingWhop, setSavingWhop] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const updated = await api.patch('/host/me', { name })
      updateHost({ ...host, name: updated.name })
      setMessage('Settings saved!')
    } catch (err) {
      setMessage(err.message)
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
      setMessage('API key regenerated!')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setMessage('Copied to clipboard!')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && (
        <div className={`p-3 rounded mb-4 ${message.includes('!') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Profile settings */}
      <div className="bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Profile</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Business Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* API Key */}
      <div className="bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">API Key</h2>
        <p className="text-sm text-gray-400 mb-4">
          Use this key to authenticate your Discord bot with the backend.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 bg-gray-900 p-3 rounded text-sm break-all text-green-400">
            {showKey ? host?.api_key : '••••••••••••••••••••••••••••••••'}
          </code>
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 border border-gray-600 rounded hover:bg-gray-700 text-white"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => copyToClipboard(host?.api_key)}
            className="px-3 py-2 border border-gray-600 rounded hover:bg-gray-700 text-white"
          >
            Copy
          </button>
        </div>
        <button
          onClick={handleRegenerateKey}
          disabled={regenerating}
          className="text-red-400 hover:underline text-sm"
        >
          {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
        </button>
      </div>

      {/* Whop Integration */}
      <div className="bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Whop Integration</h2>
        <p className="text-sm text-gray-400 mb-4">
          Connect your Whop store to let customers activate their subscriptions automatically.
        </p>
        <form onSubmit={handleSaveWhop}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Whop API Key</label>
            <input
              type="password"
              value={whopApiKey}
              onChange={(e) => setWhopApiKey(e.target.value)}
              placeholder="whop_xxxxx..."
              className="w-full max-w-md px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from your Whop dashboard → Settings → API
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Product ID (optional)</label>
            <input
              type="text"
              value={whopProductId}
              onChange={(e) => setWhopProductId(e.target.value)}
              placeholder="prod_xxxxx"
              className="w-full max-w-md px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={savingWhop}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {savingWhop ? 'Saving...' : 'Save Whop Settings'}
          </button>
        </form>
        
        {host?.slug && (
          <div className="mt-6 p-4 bg-gray-700 rounded">
            <p className="text-sm text-gray-300 mb-2">Your activation URL:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 p-2 rounded text-green-400 text-sm">
                {window.location.origin}/activate/{host.slug}
              </code>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/activate/${host.slug}`)}
                className="px-3 py-2 border border-gray-600 rounded hover:bg-gray-600 text-white"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this link with customers after they purchase on Whop
            </p>
          </div>
        )}
      </div>

      {/* Discord Bot Setup */}
      <div className="bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Discord Bot Setup</h2>
        <p className="text-sm text-gray-400 mb-4">
          Configure your Discord bot with these environment variables:
        </p>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          <p>DISCORD_TOKEN=your_discord_bot_token</p>
          <p>BACKEND_URL=https://your-api-url.com/signals</p>
          <p>BACKEND_API_KEY={host?.api_key?.slice(0, 20)}...</p>
          <p>COMMAND_GUILD_ID=your_guild_id</p>
        </div>
      </div>
    </div>
  )

  async function handleSaveWhop(e) {
    e.preventDefault()
    setSavingWhop(true)
    setMessage('')
    try {
      const result = await api.patch('/host/whop-settings', {
        whop_api_key: whopApiKey,
        whop_product_id: whopProductId
      })
      updateHost({ ...host, whop_api_key: whopApiKey, whop_product_id: whopProductId, slug: result.slug })
      setMessage('Whop settings saved!')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSavingWhop(false)
    }
  }
}
