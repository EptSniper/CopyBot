import { useThemeStore } from '../../store/theme'

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore()
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
