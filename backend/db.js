const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, 'data.sqlite');
let sqlInstance = null;
let db = null;

async function initDatabase() {
  if (db) {
    return getApi();
  }

  sqlInstance = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  db = loadOrCreateDb();
  runMigrations();
  persist();

  return getApi();
}

function loadOrCreateDb() {
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    return new sqlInstance.Database(fileBuffer);
  }
  return new sqlInstance.Database();
}

function runMigrations() {
  const schema = `
    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (host_id) REFERENCES hosts(id)
    );
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (host_id) REFERENCES hosts(id)
    );
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      signal_id INTEGER NOT NULL,
      subscriber_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending | delivered | acknowledged | executed | failed
      error TEXT,
      delivered_at INTEGER,
      acknowledged_at INTEGER,
      executed_at INTEGER,
      FOREIGN KEY (signal_id) REFERENCES signals(id),
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      context TEXT,
      created_at INTEGER NOT NULL
    );
  `;

  db.exec(schema);
}

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function insert(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  const id = db.exec('SELECT last_insert_rowid() as id;')[0].values[0][0];
  persist();
  return id;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  persist();
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length ? rows[0] : null;
}

function getApi() {
  return {
    db,
    insert,
    run,
    all,
    get,
    persist,
  };
}

module.exports = { initDatabase };
