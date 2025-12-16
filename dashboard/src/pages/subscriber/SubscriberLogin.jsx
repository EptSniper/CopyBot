import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Button, Input } from '../../components/ui'

export default function SubscriberLogin() {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_URL}/subscriber/me`, {
        headers: { 'x-api-key': apiKey }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid API key')
      }

      localStorage.setItem('subscriber_api_key', apiKey)
      navigate('/subscriber/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="max-w-md w-full relative z-10 animate-fade-in" hover={false}>
        <CardContent className="p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                👤
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                Subscriber
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Subscriber Portal</h1>
          <p className="text-surface-400 text-center mb-8">Enter your API key to access your dashboard</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                label="API Key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sub_xxxxx..."
                required
              />
              <p className="text-xs text-surface-500 mt-2">
                You received this key when you activated your subscription
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
