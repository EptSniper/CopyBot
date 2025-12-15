-- Whop integration migration
-- Add Whop settings to hosts
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS whop_api_key TEXT;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS whop_product_id TEXT;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add Whop tracking to subscribers
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS whop_license_key TEXT UNIQUE;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS whop_membership_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS activated_via TEXT DEFAULT 'manual';

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_hosts_slug ON hosts(slug) WHERE slug IS NOT NULL;
