import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  surface: '#64748b',
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl">
      <p className="text-surface-400 text-sm mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  )
}

// P&L Line Chart
export function PnLChart({ data }) {
  if (!data?.length) return <EmptyChart message="No P&L data available" />

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="pnl"
          name="P&L"
          stroke={COLORS.primary}
          fill="url(#pnlGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}


// Win/Loss Bar Chart
export function WinLossChart({ data }) {
  if (!data?.length) return <EmptyChart message="No trade data available" />

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="wins" name="Wins" fill={COLORS.success} radius={[4, 4, 0, 0]} />
        <Bar dataKey="losses" name="Losses" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Win Rate Pie Chart
export function WinRatePie({ wins, losses, pending = 0 }) {
  const data = [
    { name: 'Wins', value: wins, color: COLORS.success },
    { name: 'Losses', value: losses, color: COLORS.danger },
    ...(pending > 0 ? [{ name: 'Pending', value: pending, color: COLORS.warning }] : []),
  ].filter((d) => d.value > 0)

  if (!data.length) return <EmptyChart message="No trade data" />

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Symbol Performance Bar Chart
export function SymbolChart({ data }) {
  if (!data?.length) return <EmptyChart message="No symbol data available" />

  const chartData = data.slice(0, 10).map((s) => ({
    symbol: s.symbol || 'Unknown',
    pnl: parseFloat(s.pnl || 0),
    trades: parseInt(s.trades || 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
        <YAxis type="category" dataKey="symbol" stroke="#64748b" fontSize={12} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? COLORS.success : COLORS.danger} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Empty chart placeholder
function EmptyChart({ message }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-surface-500">
      {message}
    </div>
  )
}
