-- Subscriber preferences and portal support
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS daily_trade_count INT DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS last_trade_date DATE;

-- Default preferences structure:
-- {
--   "max_trades_per_day": 10,
--   "sessions": ["ny", "london", "asia"],
--   "trading_hours": { "start": "09:00", "end": "16:00" },
--   "timezone": "America/New_York",
--   "risk": {
--     "max_position_size": 1,
--     "max_daily_loss": 500,
--     "max_daily_profit": 1000,
--     "stop_on_daily_loss": true
--   },
--   "symbols_whitelist": [],
--   "symbols_blacklist": [],
--   "auto_execute": true
-- }

COMMENT ON COLUMN subscribers.preferences IS 'JSON object with trading preferences';
