import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Card, CardContent, Button, Input, Select, Badge, StatusBadge } from '../components/ui'

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

  if (loading && signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Signal History</h1>
        <p className="text-surface-400 mt-1">View and manage your trading signals</p>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📡</div>
            <p className="text-surface-300 mb-2">No signals sent yet</p>
            <p className="text-sm text-surface-500">Use the /trade command in Discord to send your first signal</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Symbol</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Side</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Entry</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">SL</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">TP</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Deliveries</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Result</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">P&L</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Time</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.id} className="border-t border-surface-700/30 hover:bg-surface-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-surface-500">#{s.id}</td>
                      <td className="px-4 py-3 font-medium text-white">{s.payload?.symbol}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.payload?.side === 'BUY' ? 'success' : 'danger'}>
                          {s.payload?.side}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-300">{s.payload?.entryPrice || 'MARKET'}</td>
                      <td className="px-4 py-3 text-red-400">{s.payload?.stopLoss}</td>
                      <td className="px-4 py-3 text-emerald-400">{s.payload?.takeProfits?.[0]?.price}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400">{s.executed_count || 0}</span>
                        <span className="text-surface-500"> / {s.delivery_count || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.result ? (
                          <StatusBadge status={s.result} />
                        ) : <span className="text-surface-500">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {s.pnl !== null && s.pnl !== undefined ? (
                          <span className={s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            ${parseFloat(s.pnl).toFixed(2)}
                          </span>
                        ) : <span className="text-surface-500">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setEditingSignal(s); setResultForm({ result: s.result || '', pnl: s.pnl || '', exit_price: s.exit_price || '' }) }}
                          className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                        >
                          {s.result ? 'Edit' : 'Log Result'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-surface-400">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={prevPage}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
