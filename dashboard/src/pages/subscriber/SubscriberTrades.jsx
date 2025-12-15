import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

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

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'executed': return 'bg-green-900 text-green-300'
      case 'pending': return 'bg-yellow-900 text-yellow-300'
      case 'delivered': return 'bg-blue-900 text-blue-300'
      case 'skipped': return 'bg-gray-700 text-gray-400'
      case 'failed': return 'bg-red-900 text-red-300'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getResultColor = (result) => {
    switch (result) {
      case 'win': return 'text-green-400'
      case 'loss': return 'text-red-400'
      case 'breakeven': return 'text-gray-400'
      default: return 'text-gray-500'
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/subscriber/dashboard" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-white">Trade History</h1>
          </div>
          <span className="text-gray-400">{pagination.total} total trades</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {trades.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No trades yet</p>
            <p className="text-sm text-gray-500 mt-2">Signals will appear here once you start receiving them</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Symbol</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Side</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Result</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-t border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {formatDate(trade.signal_time)}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {trade.signal?.symbol || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={trade.signal?.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {trade.signal?.side?.toUpperCase() || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(trade.status)}`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getResultColor(trade.result)}>
                          {trade.result || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {trade.pnl !== null ? (
                          <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${parseFloat(trade.pnl).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
