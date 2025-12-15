require('dotenv').config();
const express = require('express');
const { randomBytes } = require('crypto');
const { initDatabase } = require('./db');

const PORT = process.env.BACKEND_PORT || 4000;
const app = express();
app.use(express.json());

let dbApi = null;

initDatabase()
  .then((api) => {
    dbApi = api;
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init database', err);
    process.exit(1);
  });

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// Create host
app.post('/hosts', (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const apiKey = makeKey('host');
  const now = Date.now();
  const id = dbApi.insert('INSERT INTO hosts (name, api_key, created_at, active) VALUES (?, ?, ?, 1);', [
    name,
    apiKey,
    now,
  ]);
  res.json({ id, api_key: apiKey });
});

// Create subscriber for a host
app.post('/hosts/:id/subscribers', (req, res) => {
  const hostId = Number(req.params.id);
  const host = dbApi.get('SELECT * FROM hosts WHERE id = ?;', [hostId]);
  if (!host) return res.status(404).json({ error: 'host not found' });

  const { name, expires_at } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const apiKey = makeKey('sub');
  const now = Date.now();
  const id = dbApi.insert(
    'INSERT INTO subscribers (host_id, name, api_key, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?);',
    [hostId, name, apiKey, 'active', expires_at || null, now],
  );
  res.json({ id, api_key: apiKey, host_id: hostId });
});

// Update subscriber status/expiry
app.patch('/subscribers/:id', (req, res) => {
  const subId = Number(req.params.id);
  const { status, expires_at } = req.body || {};
  const sub = dbApi.get('SELECT * FROM subscribers WHERE id = ?;', [subId]);
  if (!sub) return res.status(404).json({ error: 'subscriber not found' });

  const newStatus = status || sub.status;
  const newExpiry = expires_at !== undefined ? expires_at : sub.expires_at;

  dbApi.run('UPDATE subscribers SET status = ?, expires_at = ? WHERE id = ?;', [newStatus, newExpiry, subId]);
  res.json({ id: subId, status: newStatus, expires_at: newExpiry });
});

// Host overview
app.get('/hosts/:id/overview', (req, res) => {
  const hostId = Number(req.params.id);
  const host = dbApi.get('SELECT * FROM hosts WHERE id = ?;', [hostId]);
  if (!host) return res.status(404).json({ error: 'host not found' });

  const subs = dbApi.all('SELECT * FROM subscribers WHERE host_id = ?;', [hostId]);
  const signals = dbApi.all('SELECT * FROM signals WHERE host_id = ? ORDER BY created_at DESC LIMIT 20;', [hostId]);
  const errors = dbApi.all(
    `
    SELECT * FROM logs
    WHERE level = 'error'
    ORDER BY created_at DESC
    LIMIT 20;
    `,
  );

  res.json({
    host,
    subscribers: subs,
    recent_signals: signals.map((s) => ({ ...s, payload: JSON.parse(s.payload) })),
    recent_errors: errors,
  });
});

// Ingest signal from host (auth by host api key)
app.post('/signals', hostAuth, (req, res) => {
  const trade = req.body.trade || req.body;
  if (!trade || !trade.symbol || !trade.side) {
    return res.status(400).json({ error: 'trade with symbol and side is required' });
  }

  const hostId = req.host.id;
  const now = Date.now();
  const payload = JSON.stringify(trade);
  const signalId = dbApi.insert('INSERT INTO signals (host_id, payload, status, created_at) VALUES (?, ?, ?, ?);', [
    hostId,
    payload,
    'received',
    now,
  ]);

  const activeSubs = dbApi.all(
    `
    SELECT * FROM subscribers
    WHERE host_id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > ?);
  `,
    [hostId, now],
  );

  activeSubs.forEach((sub) => {
    dbApi.insert(
      'INSERT INTO deliveries (signal_id, subscriber_id, status, delivered_at) VALUES (?, ?, ?, NULL);',
      [signalId, sub.id, 'pending'],
    );
  });

  res.json({ signal_id: signalId, deliveries_created: activeSubs.length });
});

// Subscriber pulls next deliveries
app.get('/signals/next', subscriberAuth, (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));
  const deliveries = dbApi.all(
    `
    SELECT d.id as delivery_id, s.payload
    FROM deliveries d
    JOIN signals s ON s.id = d.signal_id
    WHERE d.subscriber_id = ?
      AND d.status = 'pending'
    ORDER BY s.created_at ASC
    LIMIT ?;
  `,
    [req.subscriber.id, limit],
  );

  const ids = deliveries.map((d) => d.delivery_id);
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    dbApi.run(
      `UPDATE deliveries SET status = 'delivered', delivered_at = ? WHERE id IN (${placeholders});`,
      [Date.now(), ...ids],
    );
  }

  res.json(
    deliveries.map((d) => ({
      delivery_id: d.delivery_id,
      trade: JSON.parse(d.payload),
    })),
  );
});

// Subscriber acknowledges receipt
app.post('/deliveries/:id/ack', subscriberAuth, (req, res) => {
  const delivery = dbApi.get('SELECT * FROM deliveries WHERE id = ? AND subscriber_id = ?;', [
    Number(req.params.id),
    req.subscriber.id,
  ]);
  if (!delivery) return res.status(404).json({ error: 'delivery not found' });
  dbApi.run('UPDATE deliveries SET status = ?, acknowledged_at = ? WHERE id = ?;', [
    'acknowledged',
    Date.now(),
    delivery.id,
  ]);
  res.json({ id: delivery.id, status: 'acknowledged' });
});

// Subscriber posts execution result
app.post('/deliveries/:id/exec', subscriberAuth, (req, res) => {
  const { status, filled_qty, avg_price, error } = req.body || {};
  const delivery = dbApi.get('SELECT * FROM deliveries WHERE id = ? AND subscriber_id = ?;', [
    Number(req.params.id),
    req.subscriber.id,
  ]);
  if (!delivery) return res.status(404).json({ error: 'delivery not found' });

  const finalStatus = status || 'executed';
  dbApi.run('UPDATE deliveries SET status = ?, error = ?, executed_at = ? WHERE id = ?;', [
    finalStatus,
    error || null,
    Date.now(),
    delivery.id,
  ]);

  log('info', 'execution_update', { delivery_id: delivery.id, status: finalStatus, filled_qty, avg_price, error });
  res.json({ id: delivery.id, status: finalStatus });
});

// Helpers
function hostAuth(req, res, next) {
  const key = extractKey(req);
  if (!key) return res.status(401).json({ error: 'host api key required' });
  const host = dbApi.get('SELECT * FROM hosts WHERE api_key = ?;', [key]);
  if (!host) return res.status(401).json({ error: 'invalid host api key' });
  req.host = host;
  next();
}

function subscriberAuth(req, res, next) {
  const key = extractKey(req);
  if (!key) return res.status(401).json({ error: 'subscriber api key required' });
  const sub = dbApi.get('SELECT * FROM subscribers WHERE api_key = ?;', [key]);
  if (!sub) return res.status(401).json({ error: 'invalid subscriber api key' });
  const now = Date.now();
  if (sub.status !== 'active' || (sub.expires_at && sub.expires_at < now)) {
    return res.status(403).json({ error: 'subscription inactive or expired' });
  }
  req.subscriber = sub;
  next();
}

function extractKey(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.headers['x-api-key']) return req.headers['x-api-key'];
  return null;
}

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

function log(level, message, context) {
  dbApi.insert('INSERT INTO logs (level, message, context, created_at) VALUES (?, ?, ?, ?);', [
    level,
    message,
    context ? JSON.stringify(context) : null,
    Date.now(),
  ]);
}
