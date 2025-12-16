import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, Button, Badge } from '../../components/ui'

export default function SubscriberTrades() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })
  const navigate = useNavigate()

  const apiKey = localStorage.getItem('subscriber_api_key')
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    if (!apiKey) {
      navigate('/subscriber/login')
      return
    }
    loadTrades()
  }, [pagination.offset])

  const loadTrades = async () => {
    try {
      const res = await fetch(
        `${API_URL}/subscriber/trades?limit=${pagination.limit}&offset=${pagination.offset}`,
        { headers: { 'x-api-key': apiKey } }
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setTrades(data.trades)
      setPagination(data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => new Date(date).toLocaleString()

  const getStatusVariant = (status) => {
    switch (status) {
      case 'executed': return 'success'
      case 'pending': return 'warning'
      case 'delivered': return 'info'
      case 'skipped': return 'neutral'
      case 'failed': return 'danger'
      default: return 'neutral'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/subscriber/dashboard" className="text-surface-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-white">Trade History</h1>
          </div>
          <span className="text-surface-400">{pagination.total} total trades</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        {trades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-surface-300 mb-2">No trades yet</p>
              <p className="text-sm text-surface-500">Signals will appear here once you start receiving them</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-900/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Time</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Symbol</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Side</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Result</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-surface-400">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-t border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-surface-300">
                          {formatDate(trade.signal_time)}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {trade.signal?.symbol || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={trade.signal?.side === 'buy' ? 'success' : 'danger'}>
                            {trade.signal?.side?.toUpperCase() || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(trade.status)}>
                            {trade.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {trade.result ? (
                            <Badge variant={
                              trade.result === 'win' ? 'success' :
                              trade.result === 'loss' ? 'danger' : 'neutral'
                            }>
                              {trade.result}
                            </Badge>
                          ) : (
                            <span className="text-surface-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.pnl !== null ? (
                            <span className={trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              ${parseFloat(trade.pnl).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-surface-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                  disabled={pagination.offset === 0}
                >
                  Previous
                </Button>
                <span className="text-surface-400">
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
