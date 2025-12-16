import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Button, Input } from '../../components/ui'

export default function AdminLogin() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) {
      setError('Admin token required')
      return
    }
    localStorage.setItem('adminToken', token.trim())
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="max-w-md w-full relative z-10 animate-fade-in" hover={false}>
        <CardContent className="p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
                🔐
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                Admin
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin Access</h1>
          <p className="text-surface-400 text-center mb-8">Enter your admin token to continue</p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Admin Token"
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Enter admin token"
            />
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
