require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { query } = require('./db');
const { verifyAccessToken } = require('./lib/auth');

// Routes
const authRoutes = require('./routes/auth');
const hostRoutes = require('./routes/host');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const inviteRoutes = require('./routes/invite');
const activateRoutes = require('./routes/activate');
const subscriberRoutes = require('./routes/subscriber');

const PORT = process.env.BACKEND_PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time signal delivery
const wss = new WebSocketServer({ server, path: '/ws' });
const subscriberConnections = new Map(); // subscriberId -> ws

wss.on('connection', async (ws, req) => {
  // Get API key from query string: /ws?key=sub_xxx
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const apiKey = url.searchParams.get('key');
  
  if (!apiKey) {
    ws.close(4001, 'API key required');
    return;
  }
  
  // Validate subscriber
  const sub = await one('SELECT * FROM subscribers WHERE api_key = $1 AND status = $2', [apiKey, 'active']);
  if (!sub) {
    ws.close(4002, 'Invalid API key');
    return;
  }
  
  console.log(`WebSocket: Subscriber ${sub.id} connected`);
  subscriberConnections.set(sub.id, ws);
  
  ws.on('close', () => {
    console.log(`WebSocket: Subscriber ${sub.id} disconnected`);
    subscriberConnections.delete(sub.id);
  });
  
  ws.on('message', (data) => {
    // Handle ack/exec messages from client
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'ack' && msg.delivery_id) {
        query('UPDATE deliveries SET status = $1, acknowledged_at = NOW() WHERE id = $2', ['acknowledged', msg.delivery_id]);
      } else if (msg.type === 'exec' && msg.delivery_id) {
        query('UPDATE deliveries SET status = $1, executed_at = NOW() WHERE id = $2', [msg.status || 'executed', msg.delivery_id]);
      }
    } catch {}
  });
  
  // Send any pending signals immediately
  const pending = await all(`SELECT d.id as delivery_id, s.payload FROM deliveries d JOIN signals s ON s.id = d.signal_id WHERE d.subscriber_id = $1 AND d.status = 'pending' ORDER BY s.created_at ASC`, [sub.id]);
  if (pending.length > 0) {
    ws.send(JSON.stringify({ type: 'signals', signals: pending.map(d => ({ delivery_id: d.delivery_id, trade: d.payload })) }));
    const ids = pending.map(d => d.delivery_id);
    await query(`UPDATE deliveries SET status = 'delivered', delivered_at = NOW() WHERE id = ANY($1)`, [ids]);
  }
});

// Function to push signal to connected subscribers
function pushSignalToSubscribers(subscriberIds, trade, signalId) {
  for (const subId of subscriberIds) {
    const ws = subscriberConnections.get(subId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'signal', trade, signal_id: signalId }));
      console.log(`WebSocket: Pushed signal to subscriber ${subId}`);
    }
  }
}

// CORS
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'https://copybot-dashboard.onrender.com',
    /\.onrender\.com$/
  ],
  credentials: true,
}));

// Parse JSON (except for Stripe webhook which needs raw body)
app.use((req, res, next) => {
  if (req.path === '/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// ============ PUBLIC ROUTES ============
app.use('/auth', authRoutes);
app.use('/invite', inviteRoutes);
app.use('/activate', activateRoutes);
app.use('/subscriber', subscriberRoutes);

// Billing plans (public)
app.get('/billing/plans', async (req, res) => {
  const plans = await all('SELECT * FROM plans WHERE active = TRUE ORDER BY price_cents ASC');
  res.json(plans);
});

// Stripe webhook (public, raw body)
app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('./lib/stripe');
  if (!stripe.isConfigured()) return res.status(503).json({ error: 'billing not configured' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: 'invalid signature' });
  }
  // Handle events (simplified)
  console.log('Stripe event:', event.type);
  res.json({ received: true });
});

// ============ AUTHENTICATED ROUTES ============
function jwtAuth(req, res, next) {
  const token = extractKey(req);
  if (!token) return res.status(401).json({ error: 'authentication required' });
  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid or expired token' });
  req.user = payload;
  next();
}

app.use('/host', jwtAuth, hostRoutes);

// Billing routes that need auth
app.use('/billing', jwtAuth, billingRoutes);



// ============ ADMIN ROUTES ============
function adminAuth(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(401).json({ error: 'ADMIN_TOKEN not set' });
  const key = extractKey(req);
  if (key !== ADMIN_TOKEN) return res.status(401).json({ error: 'invalid admin token' });
  next();
}

app.use('/admin', adminAuth, adminRoutes);

// ============ API KEY ROUTES ============
async function hostAuth(req, res, next) {
  const key = extractKey(req);
  if (!key) return res.status(401).json({ error: 'host api key required' });
  const hostAccount = await one('SELECT * FROM hosts WHERE api_key = $1 AND active = TRUE;', [key]);
  if (!hostAccount) return res.status(401).json({ error: 'invalid host api key' });
  req.hostAccount = hostAccount;
  next();
}

async function subscriberAuth(req, res, next) {
  const key = extractKey(req);
  if (!key) return res.status(401).json({ error: 'subscriber api key required' });
  const sub = await one('SELECT * FROM subscribers WHERE api_key = $1;', [key]);
  if (!sub) return res.status(401).json({ error: 'invalid subscriber api key' });
  if (sub.status !== 'active' || (sub.expires_at && new Date(sub.expires_at).getTime() < Date.now())) {
    return res.status(403).json({ error: 'subscription inactive or expired' });
  }
  req.subscriber = sub;
  next();
}

// Ingest signal from host
app.post('/signals', hostAuth, async (req, res) => {
  try {
    const trade = req.body.trade || req.body;
    if (!trade || !trade.symbol || !trade.side) {
      return res.status(400).json({ error: 'trade with symbol and side is required' });
    }
    const hostId = req.hostAccount.id;
    const inserted = await query('INSERT INTO signals (host_id, payload) VALUES ($1, $2) RETURNING id;', [hostId, trade]);
  const signalId = inserted.rows[0].id;
  const subs = await all(`SELECT * FROM subscribers WHERE host_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW());`, [hostId]);
  if (subs.length) {
    const values = subs.map((s, idx) => `($1, $${idx + 2}, 'pending')`).join(',');
    await query(`INSERT INTO deliveries (signal_id, subscriber_id, status) VALUES ${values};`, [signalId, ...subs.map(s => s.id)]);
    // Push via WebSocket (instant!)
    pushSignalToSubscribers(subs.map(s => s.id), trade, signalId);
    for (const sub of subs) {
      if (sub.webhook_url) sendWebhook(sub, trade).catch(err => console.error(`Webhook failed:`, err.message));
    }
  }
    res.json({ signal_id: signalId, deliveries_created: subs.length });
  } catch (err) {
    console.error('Signal ingestion error:', err);
    res.status(500).json({ error: 'failed to process signal' });
  }
});

// Subscriber pulls next
app.get('/signals/next', subscriberAuth, async (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));
  const deliveries = await all(`SELECT d.id as delivery_id, s.payload FROM deliveries d JOIN signals s ON s.id = d.signal_id WHERE d.subscriber_id = $1 AND d.status = 'pending' ORDER BY s.created_at ASC LIMIT $2;`, [req.subscriber.id, limit]);
  if (deliveries.length) {
    const ids = deliveries.map(d => d.delivery_id);
    const ph = ids.map((_, i) => `$${i + 2}`).join(',');
    await query(`UPDATE deliveries SET status = 'delivered', delivered_at = NOW() WHERE subscriber_id = $1 AND id IN (${ph});`, [req.subscriber.id, ...ids]);
  }
  res.json(deliveries.map(d => ({ delivery_id: d.delivery_id, trade: d.payload })));
});

// Acknowledge
app.post('/deliveries/:id/ack', subscriberAuth, async (req, res) => {
  const id = Number(req.params.id);
  const delivery = await one('SELECT * FROM deliveries WHERE id = $1 AND subscriber_id = $2;', [id, req.subscriber.id]);
  if (!delivery) return res.status(404).json({ error: 'delivery not found' });
  await query('UPDATE deliveries SET status = $1, acknowledged_at = NOW() WHERE id = $2;', ['acknowledged', id]);
  res.json({ id, status: 'acknowledged' });
});

// Exec update
app.post('/deliveries/:id/exec', subscriberAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status, error } = req.body || {};
  const delivery = await one('SELECT * FROM deliveries WHERE id = $1 AND subscriber_id = $2;', [id, req.subscriber.id]);
  if (!delivery) return res.status(404).json({ error: 'delivery not found' });
  const finalStatus = status || 'executed';
  await query('UPDATE deliveries SET status = $1, error = $2, executed_at = NOW() WHERE id = $3;', [finalStatus, error || null, id]);
  res.json({ id, status: finalStatus });
});

// Helpers
function extractKey(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.headers['x-api-key'] || null;
}

async function all(text, params) { return (await query(text, params)).rows; }
async function one(text, params) { return (await query(text, params)).rows[0] || null; }

async function sendWebhook(subscriber, payload) {
  const crypto = require('crypto');
  const ts = Date.now();
  const body = JSON.stringify({ trade: payload, timestamp: ts });
  let sig = '';
  if (subscriber.webhook_secret) sig = crypto.createHmac('sha256', subscriber.webhook_secret).update(`${ts}.${body}`).digest('hex');
  await fetch(subscriber.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Timestamp': ts.toString(), 'X-Webhook-Signature': sig }, body });
}

server.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT} (WebSocket on /ws)`));
