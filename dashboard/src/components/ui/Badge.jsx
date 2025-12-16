const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  neutral: 'bg-surface-700 text-surface-300 border border-surface-600',
  primary: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}

// Convenience components for common use cases
export function WinBadge({ children = 'Win', ...props }) {
  return <Badge variant="success" {...props}>{children}</Badge>
}

export function LossBadge({ children = 'Loss', ...props }) {
  return <Badge variant="danger" {...props}>{children}</Badge>
}

export function PendingBadge({ children = 'Pending', ...props }) {
  return <Badge variant="warning" {...props}>{children}</Badge>
}

export function StatusBadge({ status, ...props }) {
  const statusMap = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    win: { variant: 'success', label: 'Win' },
    loss: { variant: 'danger', label: 'Loss' },
    breakeven: { variant: 'neutral', label: 'Breakeven' },
  }
  
  const config = statusMap[status?.toLowerCase()] || { variant: 'neutral', label: status }
  
  return <Badge variant={config.variant} {...props}>{config.label}</Badge>
}
