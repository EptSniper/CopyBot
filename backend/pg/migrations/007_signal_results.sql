-- Add result tracking to signals table
ALTER TABLE signals ADD COLUMN IF NOT EXISTS result TEXT; -- win, loss, breakeven
ALTER TABLE signals ADD COLUMN IF NOT EXISTS exit_price DECIMAL(20, 8);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS pnl DECIMAL(20, 2);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_signals_result ON signals(result) WHERE result IS NOT NULL;
