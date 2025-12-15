import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'

export default function Activate() {
  const { slug } = useParams()
  const [host, setHost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [licenseKey, setLicenseKey] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadHost()
  }, [slug])

  const loadHost = async () => {
    try {
      const data = await api.get(`/activate/${slug}`)
      setHost(data)
    } catch (err) {
      setError(err.message || 'Host not found')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    setActivating(true)
    setError('')
    try {
      const data = await api.post(`/activate/${slug}`, {
        license_key: licenseKey,
        name,
        email: email || undefined
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Activation failed')
    } finally {
      setActivating(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(result.subscriber.apiKey)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Activation Successful!</h1>
            <p className="text-gray-400 mt-2">Welcome to {result.subscriber.hostName}</p>
          </div>

          <div className="bg-gray-700 rounded p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Your API Key:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 p-2 rounded text-green-400 text-sm break-all">
                {result.subscriber.apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-white">Next Steps:</h3>
            {Object.entries(result.instructions).map(([key, value]) => (
              <div key={key} className="flex gap-3 text-gray-300">
                <span className="text-blue-400">{key.replace('step', '')}.</span>
                <span>{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <Link
              to="/subscriber/login"
              className="block w-full text-center bg-gray-700 text-white py-3 rounded hover:bg-gray-600"
            >
              Go to Subscriber Portal →
            </Link>
            <p className="text-xs text-gray-500 text-center mt-2">
              Configure trading preferences, view history, and more
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {host ? `Activate ${host.name}` : 'Activate Subscription'}
          </h1>
          <p className="text-gray-400 mt-2">
            Enter your Whop license key to activate your account
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {!host ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">Host not found or not configured for activation.</p>
            <Link to="/" className="text-blue-400 hover:underline">Go to homepage</Link>
          </div>
        ) : (
          <form onSubmit={handleActivate}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-300">License Key</label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="lic_xxxxx or mem_xxxxx"
                className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Whop purchase confirmation email
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-300">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-300">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={activating}
              className="w-full bg-purple-600 text-white py-3 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {activating ? 'Activating...' : 'Activate Subscription'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
