// CSV Export utility
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header]
        // Handle nested objects
        if (typeof cell === 'object' && cell !== null) {
          cell = JSON.stringify(cell)
        }
        // Escape quotes and wrap in quotes if contains comma
        if (cell === null || cell === undefined) cell = ''
        cell = String(cell)
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    )
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Format signal data for export
export function formatSignalsForExport(signals) {
  return signals.map(s => ({
    id: s.id,
    symbol: s.payload?.symbol || '',
    side: s.payload?.side || '',
    entry_price: s.payload?.entryPrice || 'MARKET',
    stop_loss: s.payload?.stopLoss || '',
    take_profit: s.payload?.takeProfits?.[0]?.price || '',
    result: s.result || '',
    pnl: s.pnl || '',
    exit_price: s.exit_price || '',
    deliveries: s.delivery_count || 0,
    executed: s.executed_count || 0,
    created_at: s.created_at
  }))
}

// Format trades for export
export function formatTradesForExport(trades) {
  return trades.map(t => ({
    id: t.id,
    signal_time: t.signal_time,
    symbol: t.signal?.symbol || '',
    side: t.signal?.side || '',
    status: t.status,
    result: t.result || '',
    pnl: t.pnl || '',
    executed_at: t.executed_at || ''
  }))
}
