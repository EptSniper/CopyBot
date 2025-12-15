const express = require('express');
const { query } = require('../db');
const { randomBytes } = require('crypto');

const router = express.Router();

// Platform dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await one(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM hosts) as total_hosts,
        (SELECT COUNT(*) FROM hosts WHERE active = TRUE) as active_hosts,
        (SELECT COUNT(*) FROM subscribers) as total_subscribers,
        (SELECT COUNT(*) FROM subscribers WHERE status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM signals) as total_signals,
        (SELECT COUNT(*) FROM signals WHERE created_at > NOW() - INTERVAL '24 hours') as signals_24h,
        (SELECT COUNT(*) FROM deliveries) as total_deliveries,
        (SELECT COUNT(*) FROM deliveries WHERE status = 'executed') as executed_deliveries,
        (SELECT COUNT(*) FROM deliveries WHERE status = 'failed') as failed_deliveries
    `);
    
    // Revenue by plan
    const planStats = await all(`
      SELECT plan, COUNT(*) as count 
      FROM hosts 
      GROUP BY plan 
      ORDER BY count DESC
    `);
    
    // Recent hosts
    const recentHosts = await all(`
      SELECT h.*, u.email,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = h.id) as subscriber_count,
        (SELECT COUNT(*) FROM signals WHERE host_id = h.id) as signal_count
      FROM hosts h
      JOIN users u ON u.id = h.user_id
      ORDER BY h.created_at DESC
      LIMIT 10
    `);
    
    // Recent errors
    const recentErrors = await all(`
      SELECT * FROM logs 
      WHERE level = 'error' 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    res.json({
      stats,
      planStats,
      recentHosts,
      recentErrors
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'failed to get dashboard' });
  }
});

// List all hosts
router.get('/hosts', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    
    let whereClause = '';
    const params = [limit, offset];
    
    if (search) {
      whereClause = 'WHERE h.name ILIKE $3 OR u.email ILIKE $3';
      params.push(`%${search}%`);
    }
    
    const hosts = await all(`
      SELECT h.*, u.email, u.email_verified,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = h.id) as subscriber_count,
        (SELECT COUNT(*) FROM signals WHERE host_id = h.id) as signal_count
      FROM hosts h
      JOIN users u ON u.id = h.user_id
      ${whereClause}
      ORDER BY h.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);
    
    const countParams = search ? [`%${search}%`] : [];
    const total = await one(`
      SELECT COUNT(*) as count 
      FROM hosts h 
      JOIN users u ON u.id = h.user_id
      ${search ? 'WHERE h.name ILIKE $1 OR u.email ILIKE $1' : ''}
    `, countParams);
    
    res.json({
      hosts,
      pagination: { limit, offset, total: parseInt(total.count) }
    });
  } catch (err) {
    console.error('List hosts error:', err);
    res.status(500).json({ error: 'failed to list hosts' });
  }
});

// Get host details
router.get('/hosts/:id', async (req, res) => {
  try {
    const hostId = parseInt(req.params.id);
    
    const host = await one(`
      SELECT h.*, u.email, u.email_verified, u.created_at as user_created_at
      FROM hosts h
      JOIN users u ON u.id = h.user_id
      WHERE h.id = $1
    `, [hostId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const subscribers = await all(
      'SELECT * FROM subscribers WHERE host_id = $1 ORDER BY created_at DESC',
      [hostId]
    );
    
    const recentSignals = await all(
      'SELECT * FROM signals WHERE host_id = $1 ORDER BY created_at DESC LIMIT 20',
      [hostId]
    );
    
    const stats = await one(`
      SELECT
        (SELECT COUNT(*) FROM subscribers WHERE host_id = $1) as total_subscribers,
        (SELECT COUNT(*) FROM subscribers WHERE host_id = $1 AND status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM signals WHERE host_id = $1) as total_signals,
        (SELECT COUNT(*) FROM deliveries d JOIN signals s ON s.id = d.signal_id WHERE s.host_id = $1 AND d.status = 'executed') as executed_deliveries
    `, [hostId]);
    
    res.json({
      host,
      subscribers,
      recentSignals,
      stats
    });
  } catch (err) {
    console.error('Get host error:', err);
    res.status(500).json({ error: 'failed to get host' });
  }
});

// Update host (admin)
router.patch('/hosts/:id', async (req, res) => {
  try {
    const hostId = parseInt(req.params.id);
    const { name, active, plan, subscriber_limit } = req.body;
    
    const host = await one('SELECT * FROM hosts WHERE id = $1', [hostId]);
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const updates = [];
    const values = [];
    let idx = 1;
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (active !== undefined) { updates.push(`active = $${idx++}`); values.push(active); }
    if (plan !== undefined) { updates.push(`plan = $${idx++}`); values.push(plan); }
    if (subscriber_limit !== undefined) { updates.push(`subscriber_limit = $${idx++}`); values.push(subscriber_limit); }
    
    if (updates.length === 0) {
      return res.json(host);
    }
    
    values.push(hostId);
    const result = await query(
      `UPDATE hosts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update host error:', err);
    res.status(500).json({ error: 'update failed' });
  }
});

// Create host manually (admin)
router.post('/hosts', async (req, res) => {
  try {
    const { name, email, plan, subscriber_limit } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const apiKey = makeKey('host');
    
    // If email provided, check for existing user or create placeholder
    let userId = null;
    if (email) {
      const existingUser = await one('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser) {
        userId = existingUser.id;
      }
    }
    
    const result = await query(
      'INSERT INTO hosts (user_id, name, api_key, plan, subscriber_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, apiKey, plan || 'free', subscriber_limit || 10]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create host error:', err);
    res.status(500).json({ error: 'failed to create host' });
  }
});

// Create subscriber for any host (admin)
router.post('/hosts/:id/subscribers', async (req, res) => {
  try {
    const hostId = parseInt(req.params.id);
    const host = await one('SELECT * FROM hosts WHERE id = $1', [hostId]);
    
    if (!host) {
      return res.status(404).json({ error: 'host not found' });
    }
    
    const { name, email, expires_at, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const apiKey = makeKey('sub');
    
    const result = await query(
      'INSERT INTO subscribers (host_id, name, email, api_key, status, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [hostId, name, email || null, apiKey, status || 'active', expires_at || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create subscriber error:', err);
    res.status(500).json({ error: 'failed to create subscriber' });
  }
});

// Get all billing events
router.get('/billing-events', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = parseInt(req.query.offset) || 0;
    
    const events = await all(
      'SELECT * FROM billing_events ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    const total = await one('SELECT COUNT(*) as count FROM billing_events');
    
    res.json({
      events,
      pagination: { limit, offset, total: parseInt(total.count) }
    });
  } catch (err) {
    console.error('List billing events error:', err);
    res.status(500).json({ error: 'failed to list billing events' });
  }
});

// Get logs
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit) || 100);
    const offset = parseInt(req.query.offset) || 0;
    const level = req.query.level;
    
    let whereClause = '';
    const params = [limit, offset];
    
    if (level) {
      whereClause = 'WHERE level = $3';
      params.push(level);
    }
    
    const logs = await all(
      `SELECT * FROM logs ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    
    res.json(logs);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'failed to get logs' });
  }
});

// Helpers
async function one(text, params = []) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

async function all(text, params = []) {
  const res = await query(text, params);
  return res.rows;
}

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

module.exports = router;
