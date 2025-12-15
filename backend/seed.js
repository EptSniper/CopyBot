require('dotenv').config();
const { randomBytes } = require('crypto');
const { initDatabase } = require('./db');

async function main() {
  const db = await initDatabase();

  // create host if none
  let host = db.get('SELECT * FROM hosts LIMIT 1;');
  if (!host) {
    const apiKey = makeKey('host');
    const now = Date.now();
    const id = db.insert('INSERT INTO hosts (name, api_key, created_at, active) VALUES (?, ?, ?, 1);', [
      'Demo Host',
      apiKey,
      now,
    ]);
    host = db.get('SELECT * FROM hosts WHERE id = ?;', [id]);
    console.log('Created host:', host.name, 'api_key:', host.api_key);
  } else {
    console.log('Existing host:', host.name, 'api_key:', host.api_key);
  }

  let sub = db.get('SELECT * FROM subscribers WHERE host_id = ? LIMIT 1;', [host.id]);
  if (!sub) {
    const apiKey = makeKey('sub');
    const now = Date.now();
    const id = db.insert(
      'INSERT INTO subscribers (host_id, name, api_key, status, created_at) VALUES (?, ?, ?, ?, ?);',
      [host.id, 'Demo Subscriber', apiKey, 'active', now],
    );
    sub = db.get('SELECT * FROM subscribers WHERE id = ?;', [id]);
    console.log('Created subscriber:', sub.name, 'api_key:', sub.api_key);
  } else {
    console.log('Existing subscriber:', sub.name, 'api_key:', sub.api_key);
  }
}

function makeKey(prefix) {
  return `${prefix}_${randomBytes(24).toString('base64url')}`;
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
