const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Subscriber auth middleware (uses API key)
async function subAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  
  const sub = await one('SELECT s.*, h.name as host_name FROM subscribers s JOIN hosts h ON h.id = s.host_id WHERE s.api_key = $1', [apiKey]);
  if (!sub) return res.status(401).json({ error: 'Invalid API key' });
  
  req.subscriber = sub;
  next();
}

// Get subscriber profile
router.get('/me', subAuth, async (req, res) => {
  const sub = req.subscriber;
  
  // Get trade stats
  const stats = await one(`
    SELECT 
      COUNT(*) as total_signals,
      COUNT(*) FILTER (WHERE d.status = 'executed') as executed,
      COUNT(*) FILTER (WHERE d.status = 'skipped') as skipped,
      COUNT(*) FILTER (WHERE d.result = 'win') as wins,
      COUNT(*) FILTER (WHERE d.result = 'loss') as losses,
      COALESCE(SUM(d.pnl), 0) as total_pnl
    FROM deliveries d
    WHERE d.subscriber_id = $1
  `, [sub.id]);

  res.json({
    id: sub.id,
    name: sub.name,
    email: sub.email,
    host_name: sub.host_name,
    status: sub.status,
    api_key: sub.api_key,
    preferences: sub.preferences || getDefaultPreferences(),
    daily_trade_count: sub.daily_trade_count || 0,
    stats,
    created_at: sub.created_at
  });
});

// Update subscriber preferences
router.patch('/preferences', subAuth, async (req, res) => {
  const sub = req.subscriber;
  const newPrefs = req.body;
  
  // Validate preferences
  const validated = validatePreferences(newPrefs);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  // Merge with existing
  const currentPrefs = sub.preferences || {};
  const merged = { ...currentPrefs, ...validated.preferences };

  await query('UPDATE subscribers SET preferences = $1 WHERE id = $2', [merged, sub.id]);

  res.json({ ok: true, preferences: merged });
});

// Get trade history
router.get('/trades', subAuth, async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = parseInt(req.query.offset) || 0;

  const trades = await all(`
    SELECT d.*, s.payload as signal, s.created_at as signal_time
    FROM deliveries d
    JOIN signals s ON s.id = d.signal_id
    WHERE d.subscriber_id = $1
    ORDER BY s.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.subscriber.id, limit, offset]);

  const total = await one('SELECT COUNT(*) as count FROM deliveries WHERE subscriber_id = $1', [req.subscriber.id]);

  res.json({
    trades,
    pagination: { limit, offset, total: parseInt(total.count) }
  });
});

// Reset daily trade count (called by system or manually)
router.post('/reset-daily', subAuth, async (req, res) => {
  await query('UPDATE subscribers SET daily_trade_count = 0, last_trade_date = CURRENT_DATE WHERE id = $1', [req.subscriber.id]);
  res.json({ ok: true });
});

// Helper functions
function getDefaultPreferences() {
  return {
    max_trades_per_day: 0, // 0 = unlimited
    sessions: ['ny', 'london', 'asia'],
    trading_hours: { enabled: false, start: '09:00', end: '16:00' },
    timezone: 'America/New_York',
    risk: {
      max_position_size: 0, // 0 = use signal size
      max_daily_loss: 0, // 0 = unlimited
      max_daily_profit: 0, // 0 = unlimited
      stop_on_daily_loss: false
    },
    symbols_whitelist: [], // empty = all allowed
    symbols_blacklist: [],
    auto_execute: true
  };
}

function validatePreferences(prefs) {
  const result = { preferences: {} };

  if (prefs.max_trades_per_day !== undefined) {
    const val = parseInt(prefs.max_trades_per_day);
    if (isNaN(val) || val < 0) return { error: 'max_trades_per_day must be >= 0' };
    result.preferences.max_trades_per_day = val;
  }

  if (prefs.sessions !== undefined) {
    if (!Array.isArray(prefs.sessions)) return { error: 'sessions must be an array' };
    const valid = ['ny', 'london', 'asia'];
    result.preferences.sessions = prefs.sessions.filter(s => valid.includes(s));
  }

  if (prefs.trading_hours !== undefined) {
    result.preferences.trading_hours = {
      enabled: !!prefs.trading_hours.enabled,
      start: prefs.trading_hours.start || '09:00',
      end: prefs.trading_hours.end || '16:00'
    };
  }

  if (prefs.timezone !== undefined) {
    result.preferences.timezone = String(prefs.timezone);
  }

  if (prefs.risk !== undefined) {
    result.preferences.risk = {
      max_position_size: Math.max(0, parseFloat(prefs.risk.max_position_size) || 0),
      max_daily_loss: Math.max(0, parseFloat(prefs.risk.max_daily_loss) || 0),
      max_daily_profit: Math.max(0, parseFloat(prefs.risk.max_daily_profit) || 0),
      stop_on_daily_loss: !!prefs.risk.stop_on_daily_loss
    };
  }

  if (prefs.symbols_whitelist !== undefined) {
    result.preferences.symbols_whitelist = Array.isArray(prefs.symbols_whitelist) 
      ? prefs.symbols_whitelist.map(s => String(s).toUpperCase())
      : [];
  }

  if (prefs.symbols_blacklist !== undefined) {
    result.preferences.symbols_blacklist = Array.isArray(prefs.symbols_blacklist)
      ? prefs.symbols_blacklist.map(s => String(s).toUpperCase())
      : [];
  }

  if (prefs.auto_execute !== undefined) {
    result.preferences.auto_execute = !!prefs.auto_execute;
  }

  return result;
}

async function one(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

async function all(text, params) {
  const res = await query(text, params);
  return res.rows;
}

module.exports = router;
