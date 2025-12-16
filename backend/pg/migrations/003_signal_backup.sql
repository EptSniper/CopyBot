-- Signal backup and redundancy tables

-- Signal backups for recovery
CREATE TABLE IF NOT EXISTS signal_backups (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  signal_id INTEGER NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, delivered, failed
  delivery_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(signal_id)
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- success, failed
  attempts INTEGER DEFAULT 1,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add retry_count to deliveries if not exists
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_backups_host_status ON signal_backups(host_id, status);
CREATE INDEX IF NOT EXISTS idx_signal_backups_created ON signal_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscriber ON webhook_logs(subscriber_id, created_at);
