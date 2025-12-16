/**
 * Enhanced webhook delivery with retry logic and logging
 */
const crypto = require('crypto');
const { query } = require('../db');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

/**
 * Send webhook with retry logic
 */
async function sendWebhook(subscriber, payload, eventType = 'signal') {
  if (!subscriber.webhook_url) return { success: false, reason: 'no_webhook_url' };

  const ts = Date.now();
  const body = JSON.stringify({ 
    event: eventType,
    data: payload, 
    timestamp: ts,
    subscriber_id: subscriber.id
  });

  // Generate signature
  let signature = '';
  if (subscriber.webhook_secret) {
    signature = crypto
      .createHmac('sha256', subscriber.webhook_secret)
      .update(`${ts}.${body}`)
      .digest('hex');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Timestamp': ts.toString(),
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': eventType,
    'User-Agent': 'CopyBot-Webhook/1.0'
  };

  let lastError = null;
  let attempts = 0;

  for (let i = 0; i <= MAX_RETRIES; i++) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(subscriber.webhook_url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        await logWebhook(subscriber.id, eventType, 'success', attempts, null);
        return { success: true, attempts, status: response.status };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (err) {
      lastError = err.name === 'AbortError' ? 'Timeout' : err.message;
    }


    // Wait before retry (except on last attempt)
    if (i < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[i]));
    }
  }

  // All retries failed
  await logWebhook(subscriber.id, eventType, 'failed', attempts, lastError);
  return { success: false, attempts, error: lastError };
}

/**
 * Log webhook delivery attempt
 */
async function logWebhook(subscriberId, eventType, status, attempts, error) {
  try {
    await query(
      `INSERT INTO webhook_logs (subscriber_id, event_type, status, attempts, error, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [subscriberId, eventType, status, attempts, error]
    );
  } catch (err) {
    // Table might not exist yet, just log to console
    console.log(`[Webhook] ${status}: sub=${subscriberId} event=${eventType} attempts=${attempts}`, error || '');
  }
}

/**
 * Get webhook logs for a subscriber
 */
async function getWebhookLogs(subscriberId, limit = 50) {
  try {
    const result = await query(
      `SELECT * FROM webhook_logs WHERE subscriber_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [subscriberId, limit]
    );
    return result.rows;
  } catch (err) {
    return [];
  }
}

/**
 * Test webhook endpoint
 */
async function testWebhook(url, secret) {
  const ts = Date.now();
  const body = JSON.stringify({
    event: 'test',
    data: { message: 'This is a test webhook from CopyBot' },
    timestamp: ts
  });

  let signature = '';
  if (secret) {
    signature = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': ts.toString(),
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test',
        'User-Agent': 'CopyBot-Webhook/1.0'
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Timeout (10s)' : err.message
    };
  }
}

module.exports = {
  sendWebhook,
  logWebhook,
  getWebhookLogs,
  testWebhook
};
