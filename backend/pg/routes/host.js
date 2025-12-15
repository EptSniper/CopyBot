const express = require('express');
const { query } = require('../db');
const { randomBytes } = require('crypto');
const stripe = require('../lib/stripe');

const router = express.Router();

// Get current host profile
router.get('/me', async (req, res) => {
  try {
    const host = await one(
      `SELECT h.*, u.email, u.email_verified,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = h.id) as subscriber_count,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = h.id AND status = 'active') as active_subscriber_count,
        (SELECT COUNT(*) FROM signals WHERE host_id = h.id) as signal_count
      FROM hosts h
      JOIN users u ON u.id = h.user_id
      WHERE h.user_id = $1`,
      [req.user.userId]
    );
    
    if (!host) {
      return res.status(404).json({ error: 'host profile not found' });
    }
    
    res.json(host);
  } catch (err) {
    console.error('Get host error:', err);
    res.status(500).json({ error: 'failed to get profile' });
  }
});

// Update host settings
router.patch('/me', async (req, res) => {
  try {
    const { name, settings } = req.body;
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const newName = name || host.name;
    const newSettings = settings ? { ...host.settings, ...settings } : host.settings;
    
    await query(
      'UPDATE hosts SET name = $1, settings = $2 WHERE id = $3',
      [newName, newSettings, host.id]
    );
    
    res.json({ id: host.id, name: newName, settings: newSettings });
  } catch (err) {
    console.error('Update host error:', err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Regenerate API key
router.post('/me/regenerate-key', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const newApiKey = makeKey('host');
    await query('UPDATE hosts SET api_key = $1 WHERE id = $2', [newApiKey, host.id]);
    
    res.json({ api_key: newApiKey });
  } catch (err) {
    console.error('Regenerate key error:', err);
    res.status(500).json({ error: 'regeneration failed' });
  }
});

// List host's subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const subscribers = await all(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM deliveries d JOIN signals sig ON sig.id = d.signal_id WHERE d.subscriber_id = s.id) as total_deliveries,
        (SELECT COUNT(*) FROM deliveries d JOIN signals sig ON sig.id = d.signal_id WHERE d.subscriber_id = s.id AND d.status = 'executed') as executed_deliveries
      FROM subscribers s
      WHERE s.host_id = $1
      ORDER BY s.created_at DESC`,
      [host.id]
    );
    
    res.json(subscribers);
  } catch (err) {
    console.error('List subscribers error:', err);
    res.status(500).json({ error: 'failed to list subscribers' });
  }
});

// Create subscriber (host creates for their client)
router.post('/subscribers', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    // Check subscriber limit
    const count = await one('SELECT COUNT(*) as count FROM subscribers WHERE host_id = $1', [host.id]);
    if (parseInt(count.count) >= host.subscriber_limit) {
      return res.status(403).json({ error: 'subscriber limit reached, upgrade your plan' });
    }
    
    const { name, email, expires_at, price_cents, webhook_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const apiKey = makeKey('sub');
    const webhookSecret = webhook_url ? makeKey('whsec') : null;
    
    const result = await query(
      `INSERT INTO subscribers (host_id, name, email, api_key, status, expires_at, price_cents, webhook_url, webhook_secret)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
       RETURNING *`,
      [host.id, name, email || null, apiKey, expires_at || null, price_cents || 0, webhook_url || null, webhookSecret]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create subscriber error:', err);
    res.status(500).json({ error: 'failed to create subscriber' });
  }
});

// Update subscriber
router.patch('/subscribers/:id', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    const subId = parseInt(req.params.id);
    
    const sub = await one('SELECT * FROM subscribers WHERE id = $1 AND host_id = $2', [subId, host.id]);
    if (!sub) {
      return res.status(404).json({ error: 'subscriber not found' });
    }
    
    const { name, email, status, expires_at, price_cents, webhook_url } = req.body;
    
    const updates = [];
    const values = [];
    let idx = 1;
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (expires_at !== undefined) { updates.push(`expires_at = $${idx++}`); values.push(expires_at); }
    if (price_cents !== undefined) { updates.push(`price_cents = $${idx++}`); values.push(price_cents); }
    if (webhook_url !== undefined) { 
      updates.push(`webhook_url = $${idx++}`); 
      values.push(webhook_url);
      if (webhook_url && !sub.webhook_secret) {
        updates.push(`webhook_secret = $${idx++}`);
        values.push(makeKey('whsec'));
      }
    }
    
    if (updates.length === 0) {
      return res.json(sub);
    }
    
    values.push(subId);
    const result = await query(
      `UPDATE subscribers SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update subscriber error:', err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Delete subscriber
router.delete('/subscribers/:id', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    const subId = parseInt(req.params.id);
    
    const sub = await one('SELECT * FROM subscribers WHERE id = $1 AND host_id = $2', [subId, host.id]);
    if (!sub) {
      return res.status(404).json({ error: 'subscriber not found' });
    }
    
    await query('DELETE FROM subscribers WHERE id = $1', [subId]);
    
    res.json({ ok: true, deleted: subId });
  } catch (err) {
    console.error('Delete subscriber error:', err);
    res.status(500).json({ error: 'delete failed' });
  }
});

// Get host's signals
router.get('/signals', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = parseInt(req.query.offset) || 0;
    
    const signals = await all(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM deliveries WHERE signal_id = s.id) as delivery_count,
        (SELECT COUNT(*) FROM deliveries WHERE signal_id = s.id AND status = 'executed') as executed_count
      FROM signals s
      WHERE s.host_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3`,
      [host.id, limit, offset]
    );
    
    const total = await one('SELECT COUNT(*) as count FROM signals WHERE host_id = $1', [host.id]);
    
    res.json({
      signals,
      pagination: { limit, offset, total: parseInt(total.count) }
    });
  } catch (err) {
    console.error('List signals error:', err);
    res.status(500).json({ error: 'failed to list signals' });
  }
});

// Get host stats/dashboard
router.get('/stats', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const stats = await one(`
      SELECT
        (SELECT COUNT(*) FROM subscribers WHERE host_id = $1) as total_subscribers,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = $1 AND status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM signals WHERE host_id = $1) as total_signals,
        (SELECT COUNT(*) FROM signals WHERE host_id = $1 AND created_at > NOW() - INTERVAL '24 hours') as signals_24h,
        (SELECT COUNT(*) FROM signals WHERE host_id = $1 AND created_at > NOW() - INTERVAL '7 days') as signals_7d,
        (SELECT COUNT(*) FROM deliveries d JOIN signals s ON s.id = d.signal_id WHERE s.host_id = $1 AND d.status = 'executed') as executed_deliveries,
        (SELECT COUNT(*) FROM deliveries d JOIN signals s ON s.id = d.signal_id WHERE s.host_id = $1 AND d.status = 'failed') as failed_deliveries
    `, [host.id]);
    
    // Recent signals
    const recentSignals = await all(
      'SELECT * FROM signals WHERE host_id = $1 ORDER BY created_at DESC LIMIT 10',
      [host.id]
    );
    
    res.json({
      host: { id: host.id, name: host.name, plan: host.plan, subscriber_limit: host.subscriber_limit },
      stats,
      recentSignals
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'failed to get stats' });
  }
});

// Get trade analytics
router.get('/analytics', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    if (!host) return res.status(404).json({ error: 'host not found' });

    const days = parseInt(req.query.days) || 30;

    // Overall stats
    const overall = await one(`
      SELECT
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE d.result = 'win') as wins,
        COUNT(*) FILTER (WHERE d.result = 'loss') as losses,
        COUNT(*) FILTER (WHERE d.result = 'breakeven') as breakeven,
        COUNT(*) FILTER (WHERE d.result IS NULL OR d.result = 'pending') as pending,
        COALESCE(SUM(d.pnl), 0) as total_pnl,
        COALESCE(AVG(d.pnl) FILTER (WHERE d.result IS NOT NULL), 0) as avg_pnl,
        COALESCE(AVG(d.pnl_percent) FILTER (WHERE d.result IS NOT NULL), 0) as avg_pnl_percent
      FROM deliveries d
      JOIN signals s ON s.id = d.signal_id
      WHERE s.host_id = $1 AND s.created_at > NOW() - INTERVAL '1 day' * $2
    `, [host.id, days]);

    // Daily breakdown
    const daily = await all(`
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as trades,
        COUNT(*) FILTER (WHERE d.result = 'win') as wins,
        COUNT(*) FILTER (WHERE d.result = 'loss') as losses,
        COALESCE(SUM(d.pnl), 0) as pnl
      FROM deliveries d
      JOIN signals s ON s.id = d.signal_id
      WHERE s.host_id = $1 AND s.created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
    `, [host.id, days]);

    // By symbol
    const bySymbol = await all(`
      SELECT 
        s.payload->>'symbol' as symbol,
        COUNT(*) as trades,
        COUNT(*) FILTER (WHERE d.result = 'win') as wins,
        COUNT(*) FILTER (WHERE d.result = 'loss') as losses,
        COALESCE(SUM(d.pnl), 0) as pnl
      FROM deliveries d
      JOIN signals s ON s.id = d.signal_id
      WHERE s.host_id = $1 AND s.created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY s.payload->>'symbol'
      ORDER BY trades DESC
      LIMIT 10
    `, [host.id, days]);

    // Win rate calculation
    const closedTrades = (parseInt(overall.wins) || 0) + (parseInt(overall.losses) || 0);
    const winRate = closedTrades > 0 ? ((parseInt(overall.wins) || 0) / closedTrades * 100).toFixed(1) : 0;

    res.json({
      period: `${days} days`,
      overall: {
        ...overall,
        win_rate: winRate
      },
      daily,
      bySymbol
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'failed to get analytics' });
  }
});

// Update trade result (for manual tracking)
router.patch('/signals/:signalId/result', async (req, res) => {
  try {
    const host = await one('SELECT * FROM hosts WHERE user_id = $1', [req.user.userId]);
    if (!host) return res.status(404).json({ error: 'host not found' });

    const signalId = parseInt(req.params.signalId);
    const signal = await one('SELECT * FROM signals WHERE id = $1 AND host_id = $2', [signalId, host.id]);
    if (!signal) return res.status(404).json({ error: 'signal not found' });

    const { result, exit_price, pnl, pnl_percent, notes } = req.body;

    await query(`
      UPDATE deliveries SET 
        result = COALESCE($1, result),
        exit_price = COALESCE($2, exit_price),
        pnl = COALESCE($3, pnl),
        pnl_percent = COALESCE($4, pnl_percent),
        notes = COALESCE($5, notes),
        closed_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE closed_at END
      WHERE signal_id = $6
    `, [result, exit_price, pnl, pnl_percent, notes, signalId]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Update result error:', err);
    res.status(500).json({ error: 'update failed' });
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

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

module.exports = router;
