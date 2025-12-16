import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardTitle, Badge, Button, Input, Select, SkeletonTable } from '../../components/ui'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [expandedLog, setExpandedLog] = useState(null)
  const navigate = useNavigate()
  const adminToken = localStorage.getItem('adminToken')
  const limit = 50

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login')
      return
    }
    fetchLogs()
  }, [level, offset])

  async function fetchLogs() {
    setLoading(true)
    try {
      let url = `${API_BASE}/admin/logs?limit=${limit}&offset=${offset}`
      if (level) url += `&level=${level}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }
      const data = await res.json()
      setLogs(data || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setOffset(0)
    fetchLogs()
  }

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case 'error': return 'danger'
      case 'warn': return 'warning'
      case 'info': return 'primary'
      default: return 'neutral'
    }
  }

  return (
    <div className="min-h-screen text-white">
      <header className="bg-surface-900/95 backdrop-blur-md border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-surface-400 hover:text-white transition-colors">← Back</Link>
            <h1 className="text-xl font-bold">System Logs</h1>
          </div>
          <Button onClick={fetchLogs} variant="secondary" size="sm">Refresh</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>
        )}

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={level} onChange={e => { setLevel(e.target.value); setOffset(0); }}>
                <option value="">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
              </Select>
              <div className="flex-1 flex gap-2">
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search logs..."
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent>
            <CardTitle className="mb-4">📜 Logs</CardTitle>
            {loading ? (
              <SkeletonTable rows={10} cols={4} />
            ) : logs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-surface-400 border-b border-surface-700/50">
                        <th className="pb-3 font-medium w-40">Timestamp</th>
                        <th className="pb-3 font-medium w-20">Level</th>
                        <th className="pb-3 font-medium">Message</th>
                        <th className="pb-3 font-medium w-20">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => (
                        <>
                          <tr key={i} className="border-b border-surface-700/30 hover:bg-surface-800/30">
                            <td className="py-3 text-surface-400 text-xs">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                            </td>
                            <td className="py-3 text-white truncate max-w-md">{log.message}</td>
                            <td className="py-3">
                              {log.metadata && (
                                <button
                                  onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                                  className="text-primary-400 hover:text-primary-300 text-xs"
                                >
                                  {expandedLog === i ? 'Hide' : 'Show'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedLog === i && log.metadata && (
                            <tr key={`${i}-detail`}>
                              <td colSpan={4} className="py-3 bg-surface-800/50">
                                <pre className="text-xs text-surface-300 overflow-x-auto p-3 rounded">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-700/50">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    ← Previous
                  </Button>
                  <span className="text-surface-400 text-sm">
                    Showing {offset + 1} - {offset + logs.length}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={logs.length < limit}
                  >
                    Next →
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-surface-500 text-center py-8">No logs found</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
