import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function SubscriberSettings() {
  const [profile, setProfile] = useState(null)
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
      setPrefs(data.preferences || getDefaultPrefs())
    } catch (err) {
      navigate('/subscriber/login')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultPrefs = () => ({
    max_trades_per_day: 0,
    sessions: ['ny', 'london', 'asia'],
    trading_hours: { enabled: false, start: '09:00', end: '16:00' },
    timezone: 'America/New_York',
    risk: {
      max_position_size: 0,
      max_daily_loss: 0,
      max_daily_profit: 0,
      stop_on_daily_loss: false
    },
    symbols_whitelist: [],
    symbols_blacklist: [],
    auto_execute: true
  })

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/subscriber/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(prefs)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }
      setMessage('Settings saved!')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleSession = (session) => {
    const sessions = prefs.sessions || []
    if (sessions.includes(session)) {
      setPrefs({ ...prefs, sessions: sessions.filter(s => s !== session) })
    } else {
      setPrefs({ ...prefs, sessions: [...sessions, session] })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/subscriber/dashboard" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-white">Trading Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className={`p-3 rounded mb-6 ${message.includes('!') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {message}
          </div>
        )}

        {/* Trade Limits */}
        <section className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Trade Limits</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Trades Per Day
              </label>
              <input
                type="number"
                min="0"
                value={prefs?.max_trades_per_day || 0}
                onChange={(e) => setPrefs({ ...prefs, max_trades_per_day: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Auto Execute Trades
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={prefs?.auto_execute !== false}
                  onChange={(e) => setPrefs({ ...prefs, auto_execute: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-300">Automatically execute signals</span>
              </label>
            </div>
          </div>
        </section>

        {/* Trading Sessions */}
        <section className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">🌍 Trading Sessions</h2>
          <p className="text-gray-400 text-sm mb-4">Select which sessions you want to receive signals for</p>
          
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'asia', label: 'Asia', time: '7PM - 4AM ET' },
              { id: 'london', label: 'London', time: '3AM - 12PM ET' },
              { id: 'ny', label: 'New York', time: '8AM - 5PM ET' }
            ].map(session => (
              <button
                key={session.id}
                onClick={() => toggleSession(session.id)}
                className={`px-4 py-3 rounded-lg border-2 transition ${
                  prefs?.sessions?.includes(session.id)
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-gray-600 bg-gray-700 text-gray-400'
                }`}
              >
                <div className="font-semibold">{session.label}</div>
                <div className="text-xs opacity-70">{session.time}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Trading Hours */}
        <section className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">⏰ Trading Hours</h2>
          
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={prefs?.trading_hours?.enabled || false}
              onChange={(e) => setPrefs({
                ...prefs,
                trading_hours: { ...prefs.trading_hours, enabled: e.target.checked }
              })}
              className="w-5 h-5 rounded"
            />
            <span className="text-gray-300">Only trade during specific hours</span>
          </label>

          {prefs?.trading_hours?.enabled && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input
                  type="time"
                  value={prefs?.trading_hours?.start || '09:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    trading_hours: { ...prefs.trading_hours, start: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                <input
                  type="time"
                  value={prefs?.trading_hours?.end || '16:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    trading_hours: { ...prefs.trading_hours, end: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                <select
                  value={prefs?.timezone || 'America/New_York'}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Risk Management */}
        <section className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">🛡️ Risk Management</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Position Size (contracts/lots)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={prefs?.risk?.max_position_size || 0}
                onChange={(e) => setPrefs({
                  ...prefs,
                  risk: { ...prefs.risk, max_position_size: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">0 = use signal's size</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Daily Loss ($)
              </label>
              <input
                type="number"
                min="0"
                value={prefs?.risk?.max_daily_loss || 0}
                onChange={(e) => setPrefs({
                  ...prefs,
                  risk: { ...prefs.risk, max_daily_loss: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Daily Profit ($)
              </label>
              <input
                type="number"
                min="0"
                value={prefs?.risk?.max_daily_profit || 0}
                onChange={(e) => setPrefs({
                  ...prefs,
                  risk: { ...prefs.risk, max_daily_profit: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited (take profit target)</p>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs?.risk?.stop_on_daily_loss || false}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    risk: { ...prefs.risk, stop_on_daily_loss: e.target.checked }
                  })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-300">Stop trading after daily loss limit</span>
              </label>
            </div>
          </div>
        </section>

        {/* Symbol Filters */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📋 Symbol Filters</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Whitelist (only trade these)
              </label>
              <input
                type="text"
                value={(prefs?.symbols_whitelist || []).join(', ')}
                onChange={(e) => setPrefs({
                  ...prefs,
                  symbols_whitelist: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                })}
                placeholder="ES, NQ, MES (leave empty for all)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated, empty = all symbols</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Blacklist (never trade these)
              </label>
              <input
                type="text"
                value={(prefs?.symbols_blacklist || []).join(', ')}
                onChange={(e) => setPrefs({
                  ...prefs,
                  symbols_blacklist: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                })}
                placeholder="CL, GC"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated symbols to skip</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
