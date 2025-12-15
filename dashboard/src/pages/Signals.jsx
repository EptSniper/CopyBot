import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Signals() {
  const [signals, setSignals] = useState([])
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [editingSignal, setEditingSignal] = useState(null)
  const [resultForm, setResultForm] = useState({ result: '', pnl: '', exit_price: '' })

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

  const handleUpdateResult = async (signalId) => {
    try {
      await api.patch(`/host/signals/${signalId}/result`, {
        result: resultForm.result || undefined,
        pnl: resultForm.pnl ? parseFloat(resultForm.pnl) : undefined,
        exit_price: resultForm.exit_price ? parseFloat(resultForm.exit_price) : undefined
      })
      setEditingSignal(null)
      setResultForm({ result: '', pnl: '', exit_price: '' })
      loadSignals(pagination.offset)
    } catch (err) {
      alert(err.message)
    }
  }

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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Result</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">P&L</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
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
                    <td className="px-4 py-3">
                      {s.result ? (
                        <span className={`px-2 py-1 rounded text-xs ${
                          s.result === 'win' ? 'bg-green-900 text-green-300' :
                          s.result === 'loss' ? 'bg-red-900 text-red-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>{s.result}</span>
                      ) : <span className="text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {s.pnl !== null && s.pnl !== undefined ? (
                        <span className={s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${parseFloat(s.pnl).toFixed(2)}
                        </span>
                      ) : <span className="text-gray-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditingSignal(s); setResultForm({ result: s.result || '', pnl: s.pnl || '', exit_price: s.exit_price || '' }) }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        {s.result ? 'Edit' : 'Log Result'}
                      </button>
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

      {/* Result Edit Modal */}
      {editingSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">Log Trade Result</h2>
            <p className="text-gray-400 mb-4">
              Signal #{editingSignal.id}: {editingSignal.payload?.symbol} {editingSignal.payload?.side}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Result</label>
              <select
                value={resultForm.result}
                onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Select result...</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Exit Price</label>
              <input
                type="number"
                step="0.01"
                value={resultForm.exit_price}
                onChange={(e) => setResultForm({ ...resultForm, exit_price: e.target.value })}
                placeholder="5010.50"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">P&L ($)</label>
              <input
                type="number"
                step="0.01"
                value={resultForm.pnl}
                onChange={(e) => setResultForm({ ...resultForm, pnl: e.target.value })}
                placeholder="150.00 or -50.00"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingSignal(null)}
                className="flex-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateResult(editingSignal.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
