import { useState, useEffect } from 'react'
import api from '../lib/api'

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

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-3 rounded">{error}</div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Subscribers" value={stats.stats.active_subscribers} total={stats.stats.total_subscribers} />
          <StatCard label="Signals Today" value={stats.stats.signals_24h} />
          <StatCard label="Signals (7 days)" value={stats.stats.signals_7d} />
          <StatCard label="Total Signals" value={stats.stats.total_signals} />
        </div>
      )}

      {/* Trading Performance */}
      {analytics && (
        <>
          <h2 className="text-lg font-semibold mt-8">Trading Performance (30 days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

          {/* P&L Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard 
              label="Total P&L" 
              value={`$${parseFloat(analytics.overall.total_pnl || 0).toFixed(2)}`}
              color={parseFloat(analytics.overall.total_pnl) >= 0 ? 'green' : 'red'}
            />
            <StatCard 
              label="Avg P&L per Trade" 
              value={`$${parseFloat(analytics.overall.avg_pnl || 0).toFixed(2)}`}
              color={parseFloat(analytics.overall.avg_pnl) >= 0 ? 'green' : 'red'}
            />
            <StatCard 
              label="Avg P&L %" 
              value={`${parseFloat(analytics.overall.avg_pnl_percent || 0).toFixed(2)}%`}
              color={parseFloat(analytics.overall.avg_pnl_percent) >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Performance by Symbol */}
          {analytics.bySymbol && analytics.bySymbol.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Performance by Symbol</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Trades</th>
                      <th className="pb-2">Wins</th>
                      <th className="pb-2">Losses</th>
                      <th className="pb-2">Win Rate</th>
                      <th className="pb-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.bySymbol.map((row, i) => {
                      const winRate = (parseInt(row.wins) + parseInt(row.losses)) > 0 
                        ? (parseInt(row.wins) / (parseInt(row.wins) + parseInt(row.losses)) * 100).toFixed(1)
                        : '-'
                      return (
                        <tr key={i} className="border-b border-gray-700/50">
                          <td className="py-2 font-medium">{row.symbol || 'Unknown'}</td>
                          <td className="py-2">{row.trades}</td>
                          <td className="py-2 text-green-400">{row.wins}</td>
                          <td className="py-2 text-red-400">{row.losses}</td>
                          <td className="py-2">{winRate}%</td>
                          <td className={`py-2 ${parseFloat(row.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${parseFloat(row.pnl || 0).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Signals */}
      {stats?.recentSignals && stats.recentSignals.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Recent Signals</h3>
          <div className="space-y-2">
            {stats.recentSignals.slice(0, 5).map(signal => {
              const trade = signal.payload || {}
              return (
                <div key={signal.id} className="bg-gray-900 p-3 rounded flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.side}
                    </span>
                    <span className="ml-2">{trade.symbol}</span>
                    {trade.stopLoss && <span className="text-gray-500 ml-2">SL: {trade.stopLoss}</span>}
                    {trade.takeProfits?.[0] && <span className="text-gray-500 ml-2">TP: {trade.takeProfits[0].price}</span>}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(signal.created_at).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Plan Info */}
      {stats?.host && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Your Plan</h3>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded text-sm ${
              stats.host.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
              stats.host.plan === 'pro' ? 'bg-blue-900 text-blue-300' :
              'bg-gray-700 text-gray-300'
            }`}>
              {stats.host.plan.toUpperCase()}
            </span>
            <span className="text-gray-400">
              {stats.stats.active_subscribers} / {stats.host.subscriber_limit} subscribers
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, total, color }) {
  const colorClass = color === 'green' ? 'text-green-400' : 
                     color === 'red' ? 'text-red-400' : 
                     color === 'yellow' ? 'text-yellow-400' : 'text-white'
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
        {total !== undefined && <span className="text-gray-500 text-lg">/{total}</span>}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  )
}
