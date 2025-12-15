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

  if (loading && signals.length === 0) return <div className="text-center py-8">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Signal History</h1>

      {signals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No signals sent yet</p>
          <p className="text-sm text-gray-400">Use the /trade command in Discord to send your first signal</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Side</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Entry</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">SL</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">TP</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Deliveries</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{s.id}</td>
                    <td className="px-4 py-3 font-medium">{s.payload?.symbol}</td>
                    <td className={`px-4 py-3 font-medium ${s.payload?.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                      {s.payload?.side}
                    </td>
                    <td className="px-4 py-3">{s.payload?.entryPrice || 'MARKET'}</td>
                    <td className="px-4 py-3 text-red-600">{s.payload?.stopLoss}</td>
                    <td className="px-4 py-3 text-green-600">{s.payload?.takeProfits?.[0]?.price}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-600">{s.executed_count || 0}</span>
                      <span className="text-gray-400"> / {s.delivery_count || 0}</span>
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
            <p className="text-sm text-gray-600">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.offset === 0}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-4 py-2 border rounded disabled:opacity-50"
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
