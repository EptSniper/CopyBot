const express = require('express');
const { query } = require('../db');
const { verifyLicense } = require('../lib/whop');
const { randomBytes } = require('crypto');

const router = express.Router();

// Public activation endpoint - customer enters license key
router.post('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { license_key, name, email } = req.body;

    if (!license_key) {
      return res.status(400).json({ error: 'License key is required' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Find host by slug
    const host = await one(
      'SELECT * FROM hosts WHERE slug = $1 AND active = TRUE',
      [slug]
    );

    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    if (!host.whop_api_key) {
      return res.status(400).json({ error: 'Host has not configured Whop integration' });
    }

    // Check if license key already used
    const existing = await one(
      'SELECT * FROM subscribers WHERE whop_license_key = $1',
      [license_key]
    );

    if (existing) {
      return res.status(409).json({ error: 'License key already activated' });
    }

    // Verify license with Whop
    const verification = await verifyLicense(host.whop_api_key, license_key);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // Check subscriber limit
    const count = await one(
      'SELECT COUNT(*) as count FROM subscribers WHERE host_id = $1',
      [host.id]
    );
    if (parseInt(count.count) >= host.subscriber_limit) {
      return res.status(403).json({ error: 'Host has reached subscriber limit' });
    }

    // Create subscriber
    const apiKey = `sub_${randomBytes(24).toString('base64url')}`;
    const membership = verification.membership;

    const result = await query(
      `INSERT INTO subscribers (host_id, name, email, api_key, status, whop_license_key, whop_membership_id, activated_via)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, 'whop')
       RETURNING *`,
      [host.id, name, email || null, apiKey, license_key, membership?.id || null]
    );

    const subscriber = result.rows[0];

    res.status(201).json({
      success: true,
      subscriber: {
        name: subscriber.name,
        apiKey: subscriber.api_key,
        hostName: host.name
      },
      instructions: {
        step1: 'Copy your API key above',
        step2: 'Open NinjaTrader and go to CopyBot settings',
        step3: 'Paste your API key and save',
        step4: 'Trades will now sync automatically!'
      }
    });
  } catch (err) {
    console.error('Activation error:', err);
    res.status(500).json({ error: 'Activation failed, please try again' });
  }
});

// Get host info by slug (for activation page)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const host = await one(
      'SELECT id, name, slug FROM hosts WHERE slug = $1 AND active = TRUE AND whop_api_key IS NOT NULL',
      [slug]
    );

    if (!host) {
      return res.status(404).json({ error: 'Host not found or not configured' });
    }

    res.json({ name: host.name, slug: host.slug });
  } catch (err) {
    console.error('Get host error:', err);
    res.status(500).json({ error: 'Failed to get host info' });
  }
});

// Helpers
async function one(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

module.exports = router;
