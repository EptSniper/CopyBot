import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import api from '../lib/api'

export default function Dashboard() {
  const host = useAuthStore((s) => s.host)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/host/stats').then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Plan info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-blue-600 font-medium">Current Plan</span>
            <h2 className="text-xl font-bold capitalize">{host?.plan || 'Free'}</h2>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Subscriber Limit</span>
            <p className="font-bold">{stats?.stats?.active_subscribers || 0} / {host?.subscriber_limit || 10}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Subscribers" value={stats?.stats?.active_subscribers || 0} />
        <StatCard label="Total Signals" value={stats?.stats?.total_signals || 0} />
        <StatCard label="Signals (24h)" value={stats?.stats?.signals_24h || 0} />
        <StatCard label="Executed Trades" value={stats?.stats?.executed_deliveries || 0} />
      </div>

      {/* API Key */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your API Key</h2>
        <p className="text-sm text-gray-600 mb-2">Use this key in your Discord bot to send signals:</p>
        <code className="block bg-gray-100 p-3 rounded text-sm break-all">{host?.api_key}</code>
      </div>

      {/* Recent signals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Signals</h2>
        {stats?.recentSignals?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-left py-2">Entry</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSignals.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 font-medium">{s.payload?.symbol}</td>
                    <td className={`py-2 ${s.payload?.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {s.payload?.side}
                    </td>
                    <td className="py-2">{s.payload?.entryPrice || 'MARKET'}</td>
                    <td className="py-2 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No signals yet. Send your first trade from Discord!</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
