import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import api from '../lib/api'

export default function Billing() {
  const host = useAuthStore((s) => s.host)
  const [plans, setPlans] = useState([])
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/billing/plans'),
      api.get('/billing/me')
    ]).then(([plansData, billingData]) => {
      setPlans(plansData)
      setBilling(billingData)
    }).finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planName) => {
    try {
      const { checkout_url } = await api.post('/billing/checkout', { plan_name: planName })
      window.location.href = checkout_url
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will be downgraded to the free plan.')) return
    try {
      await api.post('/billing/cancel')
      window.location.reload()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  const currentPlan = plans.find(p => p.name === host?.plan) || plans[0]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Current plan */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold capitalize">{host?.plan || 'Free'}</p>
            <p className="text-gray-600">
              {currentPlan?.subscriber_limit} subscribers included
            </p>
          </div>
          {host?.plan !== 'free' && (
            <button
              onClick={handleCancel}
              className="text-red-600 hover:underline"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow p-6 ${plan.name === host?.plan ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h3 className="text-xl font-bold capitalize mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold mb-4">
              ${(plan.price_cents / 100).toFixed(0)}
              <span className="text-sm text-gray-500 font-normal">/month</span>
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li>✓ {plan.subscriber_limit} subscribers</li>
              {plan.features?.map((f, i) => (
                <li key={i}>✓ {f.replace(/_/g, ' ')}</li>
              ))}
            </ul>
            {plan.name === host?.plan ? (
              <button disabled className="w-full py-2 bg-gray-100 text-gray-500 rounded">
                Current Plan
              </button>
            ) : plan.price_cents > (currentPlan?.price_cents || 0) ? (
              <button
                onClick={() => handleUpgrade(plan.name)}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Upgrade
              </button>
            ) : (
              <button disabled className="w-full py-2 bg-gray-100 text-gray-500 rounded">
                Downgrade via Cancel
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Billing history */}
      {billing?.billingEvents?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Billing History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Event</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {billing.billingEvents.map((event) => (
                <tr key={event.id} className="border-b">
                  <td className="py-2">{event.event_type.replace(/_/g, ' ')}</td>
                  <td className="py-2 text-gray-500">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
