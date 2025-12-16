import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, StatCard, Badge, Button, getPnlColor, useToast, SkeletonCard } from '../../components/ui'

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

  const toast = useToast()

  const copyApiKey = () => {
    navigator.clipboard.writeText(profile.api_key)
    toast.success('API Key copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="h-10 w-48 bg-surface-700/50 rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  const stats = profile?.stats || {}
  const winRate = (parseInt(stats.wins) + parseInt(stats.losses)) > 0
    ? ((parseInt(stats.wins) / (parseInt(stats.wins) + parseInt(stats.losses))) * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
              👤
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Subscriber Portal</h1>
              <p className="text-sm text-surface-400">{profile?.host_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-surface-300 hidden sm:block">{profile?.name}</span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Signals" value={stats.total_signals || 0} icon="📡" />
          <StatCard label="Executed" value={stats.executed || 0} color="green" icon="✓" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="blue" icon="📊" />
          <StatCard 
            label="Total P&L" 
            value={`$${parseFloat(stats.total_pnl || 0).toFixed(2)}`}
            color={getPnlColor(stats.total_pnl)}
            icon="💰"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* API Key */}
          <Card>
            <CardContent>
              <CardTitle className="mb-4">Your API Key</CardTitle>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-900 p-3 rounded-lg text-emerald-400 text-sm break-all border border-surface-700/50">
                  {profile?.api_key}
                </code>
                <Button onClick={copyApiKey}>Copy</Button>
              </div>
              <p className="text-xs text-surface-500 mt-2">Use this in NinjaTrader CopyBot settings</p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent>
              <CardTitle className="mb-4">Subscription Status</CardTitle>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={profile?.status === 'active' ? 'success' : 'danger'} size="lg">
                  {profile?.status}
                </Badge>
                <span className="text-surface-400">
                  Today's trades: {profile?.daily_trade_count || 0}
                  {profile?.preferences?.max_trades_per_day > 0 && ` / ${profile.preferences.max_trades_per_day}`}
                </span>
              </div>
              <Link to="/subscriber/settings">
                <Button variant="secondary">Configure Trading Preferences</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/subscriber/settings">
            <Card className="h-full">
              <CardContent>
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
                <p className="text-surface-400 text-sm">Configure sessions, risk limits, and trading hours</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/subscriber/trades">
            <Card className="h-full">
              <CardContent>
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">Trade History</h3>
                <p className="text-surface-400 text-sm">View all your past signals and executions</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full opacity-60" hover={false}>
            <CardContent>
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
              <p className="text-surface-400 text-sm">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
