export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-surface-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5
          bg-surface-900/50 
          border border-surface-600 rounded-lg
          text-white placeholder-surface-500
          transition-all duration-200
          focus:outline-none focus:border-primary-500 
          focus:ring-2 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-surface-300">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5
          bg-surface-900/50 
          border border-surface-600 rounded-lg
          text-white
          transition-all duration-200
          focus:outline-none focus:border-primary-500 
          focus:ring-2 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-surface-300">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2.5
          bg-surface-900/50 
          border border-surface-600 rounded-lg
          text-white placeholder-surface-500
          transition-all duration-200
          focus:outline-none focus:border-primary-500 
          focus:ring-2 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
