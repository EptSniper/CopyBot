/**
 * Whop API client for license verification
 */

const WHOP_API_BASE = 'https://api.whop.com/api/v2';

/**
 * Verify a license key with Whop API
 * @param {string} apiKey - Host's Whop API key
 * @param {string} licenseKey - Customer's license key
 * @returns {Promise<{valid: boolean, membership?: object, error?: string}>}
 */
async function verifyLicense(apiKey, licenseKey) {
  try {
    const response = await fetch(`${WHOP_API_BASE}/memberships/${licenseKey}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'License key not found' };
      }
      if (response.status === 401) {
        return { valid: false, error: 'Invalid Whop API credentials' };
      }
      return { valid: false, error: 'Unable to verify license' };
    }

    const membership = await response.json();
    
    // Check if membership is active
    if (membership.status !== 'active' && membership.status !== 'trialing') {
      return { valid: false, error: `License is ${membership.status}` };
    }

    return { valid: true, membership };
  } catch (err) {
    console.error('Whop API error:', err);
    return { valid: false, error: 'Unable to verify license, try again' };
  }
}

/**
 * Validate Whop API credentials by making a test call
 * @param {string} apiKey - Whop API key to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${WHOP_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    }
    
    return { valid: false, error: 'Invalid Whop API key' };
  } catch (err) {
    console.error('Whop API validation error:', err);
    return { valid: false, error: 'Unable to validate API key' };
  }
}

module.exports = { verifyLicense, validateApiKey };
