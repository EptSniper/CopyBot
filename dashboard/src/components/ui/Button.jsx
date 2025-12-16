const variants = {
  primary: `
    bg-gradient-to-r from-primary-500 to-purple-500
    hover:from-primary-600 hover:to-purple-600
    text-white font-medium
    shadow-lg shadow-primary-500/25
    hover:shadow-xl hover:shadow-primary-500/30
  `,
  secondary: `
    bg-surface-800 border border-surface-600
    hover:bg-surface-700 hover:border-surface-500
    text-white
  `,
  ghost: `
    bg-transparent hover:bg-surface-800
    text-surface-300 hover:text-white
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-red-600
    hover:from-red-600 hover:to-red-700
    text-white font-medium
    shadow-lg shadow-red-500/25
  `,
  success: `
    bg-gradient-to-r from-emerald-500 to-emerald-600
    hover:from-emerald-600 hover:to-emerald-700
    text-white font-medium
    shadow-lg shadow-emerald-500/25
  `,
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
