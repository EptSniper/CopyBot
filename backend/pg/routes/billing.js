const express = require('express');
const { query } = require('../db');
const stripe = require('../lib/stripe');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Get host's billing info (requires JWT auth from server.js)
router.get('/me', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const plan = await one('SELECT * FROM plans WHERE name = $1', [host.plan]);
    
    let subscription = null;
    if (host.stripe_subscription_id && stripe.isConfigured()) {
      try {
        subscription = await stripe.getSubscription(host.stripe_subscription_id);
      } catch (e) {
        console.error('Failed to fetch subscription:', e);
      }
    }
    
    const billingEvents = await all(
      'SELECT * FROM billing_events WHERE host_id = $1 ORDER BY created_at DESC LIMIT 20',
      [host.id]
    );
    
    res.json({
      plan,
      stripe_customer_id: host.stripe_customer_id,
      stripe_subscription_id: host.stripe_subscription_id,
      subscription,
      billingEvents
    });
  } catch (err) {
    console.error('Get billing error:', err);
    res.status(500).json({ error: 'failed to get billing info' });
  }
});

// Create checkout session to upgrade plan
router.post('/checkout', async (req, res) => {
  try {
    if (!stripe.isConfigured()) {
      return res.status(503).json({ error: 'billing not configured' });
    }
    
    const { plan_name } = req.body;
    
    if (!plan_name) {
      return res.status(400).json({ error: 'plan_name is required' });
    }
    
    const plan = await one('SELECT * FROM plans WHERE name = $1 AND active = TRUE', [plan_name]);
    if (!plan) {
      return res.status(404).json({ error: 'plan not found' });
    }
    
    if (!plan.stripe_price_id) {
      return res.status(400).json({ error: 'plan not available for purchase' });
    }
    
    const host = await one('SELECT h.*, u.email FROM hosts h JOIN users u ON u.id = h.user_id WHERE h.user_id = $1', [req.user.userId]);
    
    // Create or get Stripe customer
    let customerId = host.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.createCustomer(host.email, { host_id: host.id.toString() });
      customerId = customer.id;
      await query('UPDATE hosts SET stripe_customer_id = $1 WHERE id = $2', [customerId, host.id]);
    }
    
    const session = await stripe.createHostCheckoutSession({
      customerId,
      priceId: plan.stripe_price_id,
      successUrl: `${FRONTEND_URL}/billing?success=true`,
      cancelUrl: `${FRONTEND_URL}/billing?canceled=true`,
      metadata: { host_id: host.id.toString(), plan_name }
    });
    
    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'failed to create checkout session' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    if (!stripe.isConfigured()) {
      return res.status(503).json({ error: 'billing not configured' });
    }
    
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host.stripe_subscription_id) {
      return res.status(400).json({ error: 'no active subscription' });
    }
    
    await stripe.cancelSubscription(host.stripe_subscription_id);
    
    await query(
      'UPDATE hosts SET plan = $1, stripe_subscription_id = NULL WHERE id = $2',
      ['free', host.id]
    );
    
    await logBillingEvent(null, host.id, null, 'subscription_canceled', null, { plan: host.plan });
    
    res.json({ ok: true, message: 'subscription canceled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'failed to cancel subscription' });
  }
});

// Helpers
async function one(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

async function all(text, params) {
  const res = await query(text, params);
  return res.rows;
}

async function logBillingEvent(userId, hostId, subscriberId, eventType, stripeEventId, payload) {
  await query(
    'INSERT INTO billing_events (user_id, host_id, subscriber_id, event_type, stripe_event_id, payload) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, hostId, subscriberId, eventType, stripeEventId, payload]
  );
}

module.exports = router;
