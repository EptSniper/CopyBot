import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Join() {
  const { code } = useParams()
  const [inviteInfo, setInviteInfo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })

  useEffect(() => {
    fetchInviteInfo()
  }, [code])

  async function fetchInviteInfo() {
    try {
      const res = await fetch(`${API_BASE}/invite/public/${code}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteInfo(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/invite/join/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/50 text-red-200 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="text-green-400 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white">Welcome, {result.subscriber.name}!</h2>
            <p className="text-gray-400 mt-2">You're now subscribed to {result.subscriber.hostName}</p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <label className="text-gray-400 text-sm">Your API Key (save this!):</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-gray-950 text-green-400 p-2 rounded flex-1 text-sm break-all">
                {result.subscriber.apiKey}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(result.subscriber.apiKey)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-4 text-gray-300">
            <h3 className="font-semibold text-white">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Download the CopyBot client from your signal provider</li>
              <li>Open a terminal in the client folder</li>
              <li>Run the command:
                <code className="block bg-gray-900 p-2 rounded mt-1 text-green-400 text-xs">
                  node copybot-client.js {result.subscriber.apiKey}
                </code>
              </li>
              <li>Keep the client running while NinjaTrader is open</li>
              <li>Trades will execute automatically when signals arrive!</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Join {inviteInfo.hostName}</h1>
        <p className="text-gray-400 mb-6">
          {inviteInfo.inviteName || 'Get automatic trade signals delivered to your NinjaTrader'}
        </p>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-700 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-700 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="john@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded font-semibold"
          >
            {submitting ? 'Joining...' : 'Get My API Key'}
          </button>
        </form>
      </div>
    </div>
  )
}
