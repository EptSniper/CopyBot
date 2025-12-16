const express = require('express');
const { query } = require('../db');
const { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyAccessToken,
  getRefreshExpiry,
  generateToken,
  getTokenExpiry 
} = require('../lib/auth');
const { isValidEmail } = require('../lib/security');
const { randomBytes } = require('crypto');

const router = express.Router();

// Register new host
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }
    
    // Check if email exists
    const existing = await one('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ error: 'email already registered' });
    }
    
    const passwordHash = await hashPassword(password);
    
    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email.toLowerCase(), passwordHash, 'host']
    );
    const user = userResult.rows[0];
    
    // Create host profile with API key
    const apiKey = makeKey('host');
    const hostResult = await query(
      'INSERT INTO hosts (user_id, name, api_key) VALUES ($1, $2, $3) RETURNING id, name, api_key, plan, subscriber_limit, created_at',
      [user.id, name, apiKey]
    );
    const host = hostResult.rows[0];
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    
    // Store refresh token
    await query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshToken, getRefreshExpiry(), req.ip, req.get('user-agent')]
    );
    
    // Create email verification token (would send email in production)
    const verifyToken = generateToken();
    await query(
      'INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verifyToken, getTokenExpiry(48)]
    );
    
    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      host: { id: host.id, name: host.name, api_key: host.api_key, plan: host.plan, subscriber_limit: host.subscriber_limit },
      accessToken,
      refreshToken,
      // In production, don't return this - send via email
      emailVerificationToken: verifyToken,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    
    const user = await one('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    
    await query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, refreshToken, getRefreshExpiry(), req.ip, req.get('user-agent')]
    );
    
    // Get host info
    const host = await one('SELECT id, name, api_key, plan, subscriber_limit, settings FROM hosts WHERE user_id = $1', [user.id]);
    
    res.json({
      user: { id: user.id, email: user.email, role: user.role, email_verified: user.email_verified },
      host,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }
    
    const session = await one(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    
    if (!session) {
      return res.status(401).json({ error: 'invalid or expired refresh token' });
    }
    
    const user = await one('SELECT * FROM users WHERE id = $1', [session.user_id]);
    if (!user) {
      return res.status(401).json({ error: 'user not found' });
    }
    
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    
    // Rotate refresh token
    await query('DELETE FROM sessions WHERE id = $1', [session.id]);
    await query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [user.id, newRefreshToken, getRefreshExpiry(), req.ip, req.get('user-agent')]
    );
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'logout failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }
    
    const verification = await one(
      'SELECT * FROM email_verifications WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
      [token]
    );
    
    if (!verification) {
      return res.status(400).json({ error: 'invalid or expired token' });
    }
    
    await query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [verification.user_id]);
    await query('UPDATE email_verifications SET used = TRUE WHERE id = $1', [verification.id]);
    
    res.json({ ok: true, message: 'email verified' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'verification failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    
    const user = await one('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ ok: true, message: 'if email exists, reset link sent' });
    }
    
    const token = generateToken();
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, getTokenExpiry(1)] // 1 hour expiry
    );
    
    // In production: send email with reset link
    res.json({ 
      ok: true, 
      message: 'if email exists, reset link sent',
      // Remove in production - only for testing
      resetToken: token,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'request failed' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }
    
    const reset = await one(
      'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
      [token]
    );
    
    if (!reset) {
      return res.status(400).json({ error: 'invalid or expired token' });
    }
    
    const passwordHash = await hashPassword(password);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, reset.user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [reset.id]);
    
    // Invalidate all sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [reset.user_id]);
    
    res.json({ ok: true, message: 'password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'reset failed' });
  }
});

// Helpers
async function one(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

module.exports = router;
