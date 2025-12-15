-- Users table (hosts register here)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'host', -- host | admin
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link hosts to users (1:1 for now, but allows flexibility)
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS subscriber_limit INTEGER NOT NULL DEFAULT 10;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  subscriber_limit INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, price_cents, subscriber_limit, features) VALUES
  ('free', 0, 10, '["basic_signals", "discord_bot"]'),
  ('pro', 4900, 100, '["basic_signals", "discord_bot", "telegram_bot", "webhook_delivery", "priority_support"]'),
  ('enterprise', 19900, 1000, '["basic_signals", "discord_bot", "telegram_bot", "webhook_delivery", "priority_support", "custom_branding", "api_access"]')
ON CONFLICT (name) DO NOTHING;

-- Subscriber billing (host charges their subscribers)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Billing events log
CREATE TABLE IF NOT EXISTS billing_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  host_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
  subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions (for JWT refresh tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_host_id ON subscribers(host_id);
CREATE INDEX IF NOT EXISTS idx_signals_host_id ON signals(host_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_subscriber_id ON deliveries(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
