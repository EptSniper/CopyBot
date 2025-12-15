-- Trade results tracking
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS entry_price DECIMAL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS exit_price DECIMAL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pnl DECIMAL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pnl_percent DECIMAL;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS result TEXT; -- 'win', 'loss', 'breakeven', 'pending'
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Password reset tokens (if not exists)
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_result ON deliveries(result);
CREATE INDEX IF NOT EXISTS idx_deliveries_closed_at ON deliveries(closed_at);
