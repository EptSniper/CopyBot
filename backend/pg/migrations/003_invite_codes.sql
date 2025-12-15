-- Invite codes for subscriber self-registration
CREATE TABLE IF NOT EXISTS invite_codes (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT, -- optional label like "Discord Promo"
  max_uses INTEGER, -- null = unlimited
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ, -- null = never expires
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_host_id ON invite_codes(host_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
