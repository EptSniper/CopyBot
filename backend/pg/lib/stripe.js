const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe() {
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY env var.');
  }
  return stripe;
}

function isConfigured() {
  return !!stripe;
}

// Create a customer in Stripe
async function createCustomer(email, metadata = {}) {
  const s = getStripe();
  return s.customers.create({ email, metadata });
}

// Create checkout session for host subscription
async function createHostCheckoutSession({ customerId, priceId, successUrl, cancelUrl, metadata }) {
  const s = getStripe();
  return s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

// Create checkout session for subscriber payment (host's subscriber pays)
async function createSubscriberCheckoutSession({ customerId, hostStripeAccountId, priceAmountCents, successUrl, cancelUrl, metadata }) {
  const s = getStripe();
  
  // If using Stripe Connect (host has their own Stripe account)
  if (hostStripeAccountId) {
    return s.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Signal Subscription' },
          unit_amount: priceAmountCents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      payment_intent_data: {
        application_fee_amount: Math.floor(priceAmountCents * 0.1), // 10% platform fee
        transfer_data: { destination: hostStripeAccountId },
      },
    });
  }
  
  // Simple mode: platform collects, pays out manually
  return s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Signal Subscription' },
        unit_amount: priceAmountCents,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

// Cancel subscription
async function cancelSubscription(subscriptionId) {
  const s = getStripe();
  return s.subscriptions.cancel(subscriptionId);
}

// Get subscription
async function getSubscription(subscriptionId) {
  const s = getStripe();
  return s.subscriptions.retrieve(subscriptionId);
}

// Verify webhook signature
function constructWebhookEvent(payload, signature) {
  if (!WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  const s = getStripe();
  return s.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
}

// Create Stripe Connect account for host (to receive payments)
async function createConnectAccount(email, metadata = {}) {
  const s = getStripe();
  return s.accounts.create({
    type: 'express',
    email,
    metadata,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

// Get onboarding link for Connect account
async function createConnectOnboardingLink(accountId, returnUrl, refreshUrl) {
  const s = getStripe();
  return s.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
}

module.exports = {
  getStripe,
  isConfigured,
  createCustomer,
  createHostCheckoutSession,
  createSubscriberCheckoutSession,
  cancelSubscription,
  getSubscription,
  constructWebhookEvent,
  createConnectAccount,
  createConnectOnboardingLink,
};
