import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Card, CardContent, CardTitle, StatCard, Badge, getPnlColor } from '../components/ui'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [statsData, analyticsData] = await Promise.all([
        api.get('/host/stats'),
        api.get('/host/analytics?days=30')
      ])
      setStats(statsData)
      setAnalytics(analyticsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-surface-400 mt-1">Overview of your trading signals performance</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Active Subscribers" 
            value={stats.stats.active_subscribers} 
            total={stats.stats.total_subscribers}
            icon="👥"
          />
          <StatCard label="Signals Today" value={stats.stats.signals_24h} icon="📡" />
          <StatCard label="Signals (7 days)" value={stats.stats.signals_7d} icon="📊" />
          <StatCard label="Total Signals" value={stats.stats.total_signals} icon="📈" />
        </div>
      )}

      {/* Trading Performance */}
      {analytics && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Trading Performance (30 days)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard 
                label="Win Rate" 
                value={`${analytics.overall.win_rate}%`}
                color={parseFloat(analytics.overall.win_rate) >= 50 ? 'green' : 'red'}
              />
              <StatCard label="Total Trades" value={analytics.overall.total_trades} />
              <StatCard label="Wins" value={analytics.overall.wins} color="green" />
              <StatCard label="Losses" value={analytics.overall.losses} color="red" />
              <StatCard label="Pending" value={analytics.overall.pending} color="yellow" />
            </div>
          </div>

          {/* P&L Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              label="Total P&L" 
              value={`$${parseFloat(analytics.overall.total_pnl || 0).toFixed(2)}`}
              color={getPnlColor(analytics.overall.total_pnl)}
            />
            <StatCard 
              label="Avg P&L per Trade" 
              value={`$${parseFloat(analytics.overall.avg_pnl || 0).toFixed(2)}`}
              color={getPnlColor(analytics.overall.avg_pnl)}
            />
            <StatCard 
              label="Avg P&L %" 
              value={`${parseFloat(analytics.overall.avg_pnl_percent || 0).toFixed(2)}%`}
              color={getPnlColor(analytics.overall.avg_pnl_percent)}
            />
          </div>

          {/* Performance by Symbol */}
          {analytics.bySymbol && analytics.bySymbol.length > 0 && (
            <Card>
              <CardContent>
                <CardTitle className="mb-4">Performance by Symbol</CardTitle>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-surface-400 border-b border-surface-700/50">
                        <th className="pb-3 font-medium">Symbol</th>
                        <th className="pb-3 font-medium">Trades</th>
                        <th className="pb-3 font-medium">Wins</th>
                        <th className="pb-3 font-medium">Losses</th>
                        <th className="pb-3 font-medium">Win Rate</th>
                        <th className="pb-3 font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bySymbol.map((row, i) => {
                        const winRate = (parseInt(row.wins) + parseInt(row.losses)) > 0 
                          ? (parseInt(row.wins) / (parseInt(row.wins) + parseInt(row.losses)) * 100).toFixed(1)
                          : '-'
                        return (
                          <tr key={i} className="border-b border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                            <td className="py-3 font-medium text-white">{row.symbol || 'Unknown'}</td>
                            <td className="py-3 text-surface-300">{row.trades}</td>
                            <td className="py-3 text-emerald-400">{row.wins}</td>
                            <td className="py-3 text-red-400">{row.losses}</td>
                            <td className="py-3 text-surface-300">{winRate}%</td>
                            <td className={`py-3 font-medium ${parseFloat(row.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ${parseFloat(row.pnl || 0).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Signals */}
      {stats?.recentSignals && stats.recentSignals.length > 0 && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Recent Signals</CardTitle>
            <div className="space-y-2">
              {stats.recentSignals.slice(0, 5).map(signal => {
                const trade = signal.payload || {}
                return (
                  <div key={signal.id} className="bg-surface-900/50 p-4 rounded-lg flex justify-between items-center border border-surface-700/30 hover:border-surface-600/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.side === 'BUY' ? 'success' : 'danger'}>
                        {trade.side}
                      </Badge>
                      <span className="font-medium text-white">{trade.symbol}</span>
                      {trade.stopLoss && <span className="text-surface-500 text-sm">SL: {trade.stopLoss}</span>}
                      {trade.takeProfits?.[0] && <span className="text-surface-500 text-sm">TP: {trade.takeProfits[0].price}</span>}
                    </div>
                    <span className="text-surface-500 text-sm">
                      {new Date(signal.created_at).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Info */}
      {stats?.host && (
        <Card>
          <CardContent>
            <CardTitle className="mb-3">Your Plan</CardTitle>
            <div className="flex items-center gap-4">
              <Badge 
                variant={
                  stats.host.plan === 'enterprise' ? 'purple' :
                  stats.host.plan === 'pro' ? 'primary' : 'neutral'
                }
                size="lg"
              >
                {stats.host.plan.toUpperCase()}
              </Badge>
              <span className="text-surface-400">
                {stats.stats.active_subscribers} / {stats.host.subscriber_limit} subscribers
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
