import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Signals() {
  const [signals, setSignals] = useState([])
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const loadSignals = (offset = 0) => {
    setLoading(true)
    api.get(`/host/signals?limit=50&offset=${offset}`)
      .then((data) => {
        setSignals(data.signals)
        setPagination(data.pagination)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSignals() }, [])

  const nextPage = () => loadSignals(pagination.offset + pagination.limit)
  const prevPage = () => loadSignals(Math.max(0, pagination.offset - pagination.limit))

  if (loading && signals.length === 0) return <div className="text-center py-8 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Signal History</h1>

      {signals.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-400 mb-4">No signals sent yet</p>
          <p className="text-sm text-gray-500">Use the /trade command in Discord to send your first signal</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Symbol</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Side</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Entry</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">SL</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">TP</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Deliveries</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-gray-500">#{s.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.payload?.symbol}</td>
                    <td className={`px-4 py-3 font-medium ${s.payload?.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {s.payload?.side}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{s.payload?.entryPrice || 'MARKET'}</td>
                    <td className="px-4 py-3 text-red-400">{s.payload?.stopLoss}</td>
                    <td className="px-4 py-3 text-green-400">{s.payload?.takeProfits?.[0]?.price}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-400">{s.executed_count || 0}</span>
                      <span className="text-gray-500"> / {s.delivery_count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-400">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.offset === 0}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
