import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import api from '../lib/api'
import { Card, CardContent, CardTitle, Button, Badge } from '../components/ui'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-surface-400">Loading...</div>
      </div>
    )
  }

  const currentPlan = plans.find(p => p.name === host?.plan) || plans[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-surface-400 mt-1">Manage your subscription and billing</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-400 text-sm mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-white capitalize">{host?.plan || 'Free'}</p>
                <Badge variant={
                  host?.plan === 'enterprise' ? 'purple' :
                  host?.plan === 'pro' ? 'primary' : 'neutral'
                }>
                  {currentPlan?.subscriber_limit} subscribers
                </Badge>
              </div>
            </div>
            {host?.plan !== 'free' && (
              <button
                onClick={handleCancel}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={plan.name === host?.plan ? 'ring-2 ring-primary-500' : ''}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold capitalize text-white mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-white mb-4">
                  ${(plan.price_cents / 100).toFixed(0)}
                  <span className="text-sm text-surface-400 font-normal">/month</span>
                </p>
                <ul className="text-sm text-surface-300 mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    {plan.subscriber_limit} subscribers
                  </li>
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      {f.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
                {plan.name === host?.plan ? (
                  <Button variant="secondary" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : plan.price_cents > (currentPlan?.price_cents || 0) ? (
                  <Button onClick={() => handleUpgrade(plan.name)} className="w-full">
                    Upgrade
                  </Button>
                ) : (
                  <Button variant="secondary" disabled className="w-full">
                    Downgrade via Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing history */}
      {billing?.billingEvents?.length > 0 && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Billing History</CardTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left py-2 text-surface-400 font-medium">Event</th>
                  <th className="text-left py-2 text-surface-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {billing.billingEvents.map((event) => (
                  <tr key={event.id} className="border-b border-surface-700/30">
                    <td className="py-3 text-white">{event.event_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 text-surface-400">{new Date(event.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
