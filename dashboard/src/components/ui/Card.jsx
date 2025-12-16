export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`
        bg-surface-800/50 backdrop-blur-sm rounded-xl
        border border-surface-700/50
        transition-all duration-200
        ${hover ? 'hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-surface-700/50 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-white ${className}`}>
      {children}
    </h3>
  )
}
