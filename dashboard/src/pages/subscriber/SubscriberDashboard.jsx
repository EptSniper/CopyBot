import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function SubscriberDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const apiKey = localStorage.getItem('subscriber_api_key')
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    if (!apiKey) {
      navigate('/subscriber/login')
      return
    }
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/subscriber/me`, {
        headers: { 'x-api-key': apiKey }
      })
      if (!res.ok) throw new Error('Session expired')
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
      localStorage.removeItem('subscriber_api_key')
      navigate('/subscriber/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('subscriber_api_key')
    navigate('/subscriber/login')
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(profile.api_key)
    alert('API Key copied!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const stats = profile?.stats || {}
  const winRate = (parseInt(stats.wins) + parseInt(stats.losses)) > 0
    ? ((parseInt(stats.wins) / (parseInt(stats.wins) + parseInt(stats.losses))) * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Subscriber Portal</h1>
            <p className="text-sm text-gray-400">{profile?.host_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">{profile?.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Signals</p>
            <p className="text-2xl font-bold text-white">{stats.total_signals || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Executed</p>
            <p className="text-2xl font-bold text-green-400">{stats.executed || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total P&L</p>
            <p className={`text-2xl font-bold ${parseFloat(stats.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${parseFloat(stats.total_pnl || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* API Key */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your API Key</h2>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 p-3 rounded text-green-400 text-sm break-all">
                {profile?.api_key}
              </code>
              <button
                onClick={copyApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Use this in NinjaTrader CopyBot settings</p>
          </div>

          {/* Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Subscription Status</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded text-sm ${
                profile?.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {profile?.status}
              </span>
              <span className="text-gray-400">
                Today's trades: {profile?.daily_trade_count || 0}
                {profile?.preferences?.max_trades_per_day > 0 && ` / ${profile.preferences.max_trades_per_day}`}
              </span>
            </div>
            <Link
              to="/subscriber/settings"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Configure Trading Preferences
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/subscriber/settings"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition"
          >
            <h3 className="text-lg font-semibold text-white mb-2">⚙️ Settings</h3>
            <p className="text-gray-400 text-sm">Configure sessions, risk limits, and trading hours</p>
          </Link>
          <Link
            to="/subscriber/trades"
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition"
          >
            <h3 className="text-lg font-semibold text-white mb-2">📊 Trade History</h3>
            <p className="text-gray-400 text-sm">View all your past signals and executions</p>
          </Link>
          <div className="bg-gray-800 rounded-lg p-6 opacity-60">
            <h3 className="text-lg font-semibold text-white mb-2">📈 Analytics</h3>
            <p className="text-gray-400 text-sm">Coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  )
}
