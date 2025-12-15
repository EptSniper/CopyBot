require('dotenv').config();
const { randomBytes } = require('crypto');
const { query, pool } = require('./db');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const host = await ensureHost('Demo Host');
  const sub = await ensureSubscriber(host.id, 'Demo Subscriber');

  console.log('Host:', host.name, 'api_key:', host.api_key);
  console.log('Subscriber:', sub.name, 'api_key:', sub.api_key);
  await pool.end();
}

async function ensureHost(name) {
  const existing = await one('SELECT * FROM hosts WHERE name = $1;', [name]);
  if (existing) return existing;
  const apiKey = makeKey('host');
  const res = await query(
    'INSERT INTO hosts (name, api_key) VALUES ($1, $2) RETURNING *;',
    [name, apiKey],
  );
  return res.rows[0];
}

async function ensureSubscriber(hostId, name) {
  const existing = await one('SELECT * FROM subscribers WHERE host_id = $1 AND name = $2;', [hostId, name]);
  if (existing) return existing;
  const apiKey = makeKey('sub');
  const res = await query(
    'INSERT INTO subscribers (host_id, name, api_key, status) VALUES ($1, $2, $3, $4) RETURNING *;',
    [hostId, name, apiKey, 'active'],
  );
  return res.rows[0];
}

async function one(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
