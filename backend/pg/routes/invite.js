const express = require('express');
const crypto = require('crypto');
const { query, one } = require('../db');
const { verifyAccessToken } = require('../lib/auth');

const router = express.Router();

// Generate random code
function generateCode() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate subscriber API key
function generateApiKey() {
  return 'sub_' + crypto.randomBytes(24).toString('base64url');
}

// JWT auth middleware for host routes
async function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'auth required' });
  }
  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  
  // Get host account
  const host = await one('SELECT * FROM hosts WHERE user_id = $1', [payload.userId]);
  if (!host) return res.status(404).json({ error: 'host not found' });
  
  req.user = payload;
  req.hostAccount = host;
  next();
}

// ============ HOST ROUTES (require auth) ============

// Get all invite codes for host
router.get('/', jwtAuth, async (req, res) => {
  try {
    const codes = await query(
      'SELECT * FROM invite_codes WHERE host_id = $1 ORDER BY created_at DESC',
      [req.hostAccount.id]
    );
    res.json({ codes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new invite code
router.post('/', jwtAuth, async (req, res) => {
  try {
    const { name, maxUses, expiresInDays } = req.body;
    const code = generateCode();
    
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }
    
    const invite = await one(
      `INSERT INTO invite_codes (host_id, code, name, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.hostAccount.id, code, name || null, maxUses || null, expiresAt]
    );
    
    res.json({ invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete invite code
router.delete('/:id', jwtAuth, async (req, res) => {
  try {
    await query(
      'DELETE FROM invite_codes WHERE id = $1 AND host_id = $2',
      [req.params.id, req.hostAccount.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle invite code active status
router.patch('/:id', jwtAuth, async (req, res) => {
  try {
    const { active } = req.body;
    const invite = await one(
      'UPDATE invite_codes SET active = $1 WHERE id = $2 AND host_id = $3 RETURNING *',
      [active, req.params.id, req.hostAccount.id]
    );
    res.json({ invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PUBLIC ROUTES ============

// Get invite info (public - for join page)
router.get('/public/:code', async (req, res) => {
  try {
    const invite = await one(
      `SELECT ic.*, h.name as host_name 
       FROM invite_codes ic
       JOIN hosts h ON h.id = ic.host_id
       WHERE ic.code = $1 AND ic.active = true`,
      [req.params.code]
    );
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }
    
    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite code has expired' });
    }
    
    // Check if max uses reached
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return res.status(400).json({ error: 'Invite code has reached maximum uses' });
    }
    
    res.json({
      hostName: invite.host_name,
      inviteName: invite.name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join via invite code (public)
router.post('/join/:code', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const invite = await one(
      `SELECT ic.*, h.name as host_name 
       FROM invite_codes ic
       JOIN hosts h ON h.id = ic.host_id
       WHERE ic.code = $1 AND ic.active = true`,
      [req.params.code]
    );
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }
    
    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite code has expired' });
    }
    
    // Check if max uses reached
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return res.status(400).json({ error: 'Invite code has reached maximum uses' });
    }
    
    // Create subscriber
    const apiKey = generateApiKey();
    const subscriber = await one(
      `INSERT INTO subscribers (host_id, name, email, api_key, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [invite.host_id, name, email || null, apiKey]
    );
    
    // Increment invite uses
    await query(
      'UPDATE invite_codes SET uses = uses + 1 WHERE id = $1',
      [invite.id]
    );
    
    res.json({
      success: true,
      subscriber: {
        name: subscriber.name,
        apiKey: subscriber.api_key,
        hostName: invite.host_name,
      },
      instructions: {
        step1: 'Download the CopyBot client from the host',
        step2: `Run: node copybot-client.js ${subscriber.api_key}`,
        step3: 'Keep the client running while trading',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
