import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SubscriberLogin() {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_URL}/subscriber/me`, {
        headers: { 'x-api-key': apiKey }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid API key')
      }

      // Store API key and redirect
      localStorage.setItem('subscriber_api_key', apiKey)
      navigate('/subscriber/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Subscriber Portal</h1>
          <p className="text-gray-400 mt-2">Enter your API key to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sub_xxxxx..."
              className="w-full px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              You received this key when you activated your subscription
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
