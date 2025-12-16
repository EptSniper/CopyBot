import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, Button, Input, Select, useToast, SkeletonCard } from '../../components/ui'

export default function SubscriberSettings() {
  const [profile, setProfile] = useState(null)
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
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
    risk: { max_position_size: 0, max_daily_loss: 0, max_daily_profit: 0, stop_on_daily_loss: false },
    symbols_whitelist: [],
    symbols_blacklist: [],
    auto_execute: true
  })

  const toast = useToast()

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_URL}/subscriber/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(prefs)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }
      toast.success('Settings saved!')
      setMessage({ type: 'success', text: 'Settings saved!' })
    } catch (err) {
      toast.error(err.message)
      setMessage({ type: 'error', text: err.message })
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
      <div className="min-h-screen">
        <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="h-8 w-48 bg-surface-700/50 rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/subscriber/dashboard" className="text-surface-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-white">Trading Settings</h1>
          </div>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {message.text && (
          <div className={`p-4 rounded-xl text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Trade Limits */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">📊 Trade Limits</CardTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Max Trades Per Day"
                  type="number"
                  min="0"
                  value={prefs?.max_trades_per_day || 0}
                  onChange={(e) => setPrefs({ ...prefs, max_trades_per_day: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-surface-500 mt-1">0 = unlimited</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Auto Execute Trades</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prefs?.auto_execute !== false}
                    onChange={(e) => setPrefs({ ...prefs, auto_execute: e.target.checked })}
                    className="w-5 h-5 rounded bg-surface-700 border-surface-600"
                  />
                  <span className="text-surface-300">Automatically execute signals</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Sessions */}
        <Card>
          <CardContent>
            <CardTitle className="mb-2">🌍 Trading Sessions</CardTitle>
            <p className="text-surface-400 text-sm mb-4">Select which sessions you want to receive signals for</p>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'asia', label: 'Asia', time: '7PM - 4AM ET' },
                { id: 'london', label: 'London', time: '3AM - 12PM ET' },
                { id: 'ny', label: 'New York', time: '8AM - 5PM ET' }
              ].map(session => (
                <button
                  key={session.id}
                  onClick={() => toggleSession(session.id)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    prefs?.sessions?.includes(session.id)
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-surface-600 bg-surface-800 text-surface-400 hover:border-surface-500'
                  }`}
                >
                  <div className="font-semibold">{session.label}</div>
                  <div className="text-xs opacity-70">{session.time}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Hours */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">⏰ Trading Hours</CardTitle>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={prefs?.trading_hours?.enabled || false}
                onChange={(e) => setPrefs({
                  ...prefs,
                  trading_hours: { ...prefs.trading_hours, enabled: e.target.checked }
                })}
                className="w-5 h-5 rounded bg-surface-700 border-surface-600"
              />
              <span className="text-surface-300">Only trade during specific hours</span>
            </label>

            {prefs?.trading_hours?.enabled && (
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={prefs?.trading_hours?.start || '09:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    trading_hours: { ...prefs.trading_hours, start: e.target.value }
                  })}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={prefs?.trading_hours?.end || '16:00'}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    trading_hours: { ...prefs.trading_hours, end: e.target.value }
                  })}
                />
                <Select
                  label="Timezone"
                  value={prefs?.timezone || 'America/New_York'}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">🛡️ Risk Management</CardTitle>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Input
                  label="Max Position Size (contracts/lots)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={prefs?.risk?.max_position_size || 0}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    risk: { ...prefs.risk, max_position_size: parseFloat(e.target.value) || 0 }
                  })}
                />
                <p className="text-xs text-surface-500 mt-1">0 = use signal's size</p>
              </div>
              <div>
                <Input
                  label="Max Daily Loss ($)"
                  type="number"
                  min="0"
                  value={prefs?.risk?.max_daily_loss || 0}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    risk: { ...prefs.risk, max_daily_loss: parseFloat(e.target.value) || 0 }
                  })}
                />
                <p className="text-xs text-surface-500 mt-1">0 = unlimited</p>
              </div>
              <div>
                <Input
                  label="Max Daily Profit ($)"
                  type="number"
                  min="0"
                  value={prefs?.risk?.max_daily_profit || 0}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    risk: { ...prefs.risk, max_daily_profit: parseFloat(e.target.value) || 0 }
                  })}
                />
                <p className="text-xs text-surface-500 mt-1">0 = unlimited (take profit target)</p>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prefs?.risk?.stop_on_daily_loss || false}
                    onChange={(e) => setPrefs({
                      ...prefs,
                      risk: { ...prefs.risk, stop_on_daily_loss: e.target.checked }
                    })}
                    className="w-5 h-5 rounded bg-surface-700 border-surface-600"
                  />
                  <span className="text-surface-300">Stop trading after daily loss limit</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symbol Filters */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">📋 Symbol Filters</CardTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Whitelist (only trade these)"
                  type="text"
                  value={(prefs?.symbols_whitelist || []).join(', ')}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    symbols_whitelist: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  })}
                  placeholder="ES, NQ, MES (leave empty for all)"
                />
                <p className="text-xs text-surface-500 mt-1">Comma-separated, empty = all symbols</p>
              </div>
              <div>
                <Input
                  label="Blacklist (never trade these)"
                  type="text"
                  value={(prefs?.symbols_blacklist || []).join(', ')}
                  onChange={(e) => setPrefs({
                    ...prefs,
                    symbols_blacklist: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  })}
                  placeholder="CL, GC"
                />
                <p className="text-xs text-surface-500 mt-1">Comma-separated symbols to skip</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
