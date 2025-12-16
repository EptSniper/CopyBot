export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-surface-700/50 rounded ${className}`}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm rounded-xl border border-surface-700/50 p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-surface-700/50">
        {Array(cols).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array(cols).fill(0).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
