export function StatCard({ 
  label, 
  value, 
  total, 
  color = 'default',
  icon,
  trend,
  className = '' 
}) {
  const colorClasses = {
    default: 'text-white',
    green: 'text-emerald-400',
    red: 'text-red-400',
    yellow: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  }

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-emerald-400'
    if (trend < 0) return 'text-red-400'
    return 'text-surface-400'
  }

  return (
    <div 
      className={`
        relative overflow-hidden
        bg-surface-800/50 backdrop-blur-sm rounded-xl p-5
        border border-surface-700/50
        transition-all duration-200
        hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5
        group
        ${className}
      `}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-bold ${colorClasses[color]}`}>
            {value}
            {total !== undefined && (
              <span className="text-surface-500 text-xl font-normal">/{total}</span>
            )}
          </div>
          <div className="text-surface-400 text-sm mt-1">{label}</div>
        </div>
        
        {icon && (
          <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div className={`mt-2 text-sm ${getTrendColor(trend)}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

// Helper function for P&L color coding
export function getPnlColor(value) {
  const num = parseFloat(value)
  if (isNaN(num)) return 'default'
  return num >= 0 ? 'green' : 'red'
}
