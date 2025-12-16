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
    const search = req.query.search;
    
    let whereClause = '';
    const params = [limit, offset];
    let paramIdx = 3;
    
    const conditions = [];
    if (level) {
      conditions.push(`level = $${paramIdx++}`);
      params.push(level);
    }
    if (search) {
      conditions.push(`message ILIKE $${paramIdx++}`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
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

// ============ SYSTEM HEALTH & MONITORING ============

// System health endpoint
router.get('/health', async (req, res) => {
  try {
    const startTime = global.serverStartTime || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Database health check
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    // Get pool stats if available
    const pool = require('../db').pool;
    const poolStats = pool ? {
      total: pool.totalCount || 0,
      idle: pool.idleCount || 0,
      waiting: pool.waitingCount || 0
    } : { total: 0, idle: 0, waiting: 0 };
    
    // Memory usage
    const mem = process.memoryUsage();
    
    // WebSocket connections (from global if available)
    const wsConnections = global.wsConnectionCount || 0;
    
    // Determine overall status
    let status = 'healthy';
    if (dbLatency > 1000) status = 'degraded';
    if (dbLatency > 5000) status = 'critical';
    
    res.json({
      status,
      api: {
        status: 'online',
        uptime,
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version
      },
      database: {
        status: 'connected',
        latency: dbLatency,
        pool: poolStats
      },
      websocket: {
        status: 'running',
        connections: wsConnections
      },
      memory: {
        used: mem.heapUsed,
        total: mem.heapTotal,
        rss: mem.rss,
        percentage: Math.round((mem.heapUsed / mem.heapTotal) * 100)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.json({
      status: 'critical',
      api: { status: 'online' },
      database: { status: 'error', error: err.message },
      timestamp: new Date().toISOString()
    });
  }
});

// Security metrics endpoint
router.get('/security', async (req, res) => {
  try {
    // Get rate limit stats from global store
    const rateLimitStore = global.rateLimitStore || new Map();
    const securityStats = global.securityStats || { 
      blocked: 0, 
      failedAuth: 0,
      requestsByIP: new Map()
    };
    
    // Calculate rate limit stats
    const now = Date.now();
    let authRequests = 0, apiRequests = 0, signalRequests = 0;
    let authBlocked = 0, apiBlocked = 0, signalBlocked = 0;
    
    for (const [key, data] of rateLimitStore.entries()) {
      if (now - data.windowStart < 60000) {
        if (key.includes('auth')) {
          authRequests += data.count;
          if (data.count > 10) authBlocked++;
        } else if (key.includes('signal')) {
          signalRequests += data.count;
          if (data.count > 60) signalBlocked++;
        } else {
          apiRequests += data.count;
          if (data.count > 100) apiBlocked++;
        }
      }
    }
    
    // Get top IPs
    const topIPs = [];
    const ipMap = securityStats.requestsByIP || new Map();
    for (const [ip, count] of ipMap.entries()) {
      topIPs.push({ ip, requests: count, blocked: count > 1000 });
    }
    topIPs.sort((a, b) => b.requests - a.requests);
    
    res.json({
      rateLimits: {
        auth: { current: authRequests, limit: 10, blocked: authBlocked },
        api: { current: apiRequests, limit: 100, blocked: apiBlocked },
        signals: { current: signalRequests, limit: 60, blocked: signalBlocked }
      },
      blocked24h: securityStats.blocked || 0,
      failedAuth24h: securityStats.failedAuth || 0,
      topIPs: topIPs.slice(0, 10),
      suspiciousActivity: (securityStats.blocked || 0) > 100 || (securityStats.failedAuth || 0) > 50,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Security metrics error:', err);
    res.status(500).json({ error: 'failed to get security metrics' });
  }
});

// Delivery statistics endpoint
router.get('/delivery-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Signal delivery stats
    const deliveryStats = await one(`
      SELECT
        COUNT(DISTINCT s.id) as total_signals,
        COUNT(d.id) as total_deliveries,
        COUNT(d.id) FILTER (WHERE d.status = 'delivered' OR d.status = 'executed') as delivered,
        COUNT(d.id) FILTER (WHERE d.status = 'pending') as pending,
        COUNT(d.id) FILTER (WHERE d.status = 'failed') as failed,
        COUNT(d.id) FILTER (WHERE d.status = 'skipped') as skipped,
        AVG(EXTRACT(EPOCH FROM (d.delivered_at - s.created_at)) * 1000) FILTER (WHERE d.delivered_at IS NOT NULL) as avg_latency
      FROM signals s
      LEFT JOIN deliveries d ON d.signal_id = s.id
      WHERE s.created_at > NOW() - INTERVAL '1 day' * $1
    `, [days]);
    
    // Error breakdown
    const errorBreakdown = await all(`
      SELECT error, COUNT(*) as count
      FROM deliveries
      WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 day' * $1
      GROUP BY error
      ORDER BY count DESC
      LIMIT 10
    `, [days]);
    
    // Webhook stats
    const webhookStats = await one(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        SUM(attempts) as total_attempts
      FROM webhook_logs
      WHERE created_at > NOW() - INTERVAL '1 day' * $1
    `, [days]);
    
    const total = parseInt(deliveryStats?.total_deliveries) || 1;
    const delivered = parseInt(deliveryStats?.delivered) || 0;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    
    res.json({
      period: `${days} days`,
      signals: {
        total: parseInt(deliveryStats?.total_signals) || 0,
        delivered: delivered,
        pending: parseInt(deliveryStats?.pending) || 0,
        failed: parseInt(deliveryStats?.failed) || 0,
        skipped: parseInt(deliveryStats?.skipped) || 0
      },
      successRate,
      errorBreakdown: errorBreakdown || [],
      webhooks: {
        total: parseInt(webhookStats?.total) || 0,
        success: parseInt(webhookStats?.success) || 0,
        failed: parseInt(webhookStats?.failed) || 0,
        retries: parseInt(webhookStats?.total_attempts) || 0
      },
      avgLatency: Math.round(parseFloat(deliveryStats?.avg_latency) || 0),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Delivery stats error:', err);
    res.status(500).json({ error: 'failed to get delivery stats' });
  }
});

// Database statistics endpoint
router.get('/db-stats', async (req, res) => {
  try {
    // Table row counts
    const tables = await all(`
      SELECT 
        relname as name,
        n_live_tup as rows
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);
    
    // Database size
    const dbSize = await one(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    // Connection stats
    const connStats = await one(`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) as total
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    res.json({
      tables: tables.map(t => ({
        name: t.name,
        rows: parseInt(t.rows) || 0
      })),
      totalSize: dbSize?.size || 'unknown',
      connections: {
        active: parseInt(connStats?.active) || 0,
        idle: parseInt(connStats?.idle) || 0,
        total: parseInt(connStats?.total) || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('DB stats error:', err);
    res.status(500).json({ error: 'failed to get database stats' });
  }
});

// ============ ADMIN ACTIONS ============

// Clear rate limits
router.post('/actions/clear-rate-limits', async (req, res) => {
  try {
    if (global.rateLimitStore) {
      global.rateLimitStore.clear();
    }
    res.json({ success: true, message: 'Rate limits cleared' });
  } catch (err) {
    console.error('Clear rate limits error:', err);
    res.status(500).json({ error: 'failed to clear rate limits' });
  }
});

// Broadcast message
router.post('/actions/broadcast', async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    // Store broadcast for retrieval
    global.systemBroadcast = {
      message,
      type,
      createdAt: new Date().toISOString()
    };
    
    res.json({ success: true, message: 'Broadcast sent' });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'failed to send broadcast' });
  }
});

// Get current broadcast
router.get('/actions/broadcast', async (req, res) => {
  res.json(global.systemBroadcast || null);
});

// Toggle maintenance mode
router.post('/actions/maintenance', async (req, res) => {
  try {
    const { enabled } = req.body;
    global.maintenanceMode = enabled !== undefined ? enabled : !global.maintenanceMode;
    res.json({ 
      success: true, 
      maintenanceMode: global.maintenanceMode,
      message: global.maintenanceMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
    });
  } catch (err) {
    console.error('Maintenance mode error:', err);
    res.status(500).json({ error: 'failed to toggle maintenance mode' });
  }
});

// Get maintenance status
router.get('/actions/maintenance', async (req, res) => {
  res.json({ maintenanceMode: global.maintenanceMode || false });
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
