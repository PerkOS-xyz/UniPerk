-- Run this in Neon SQL Editor to create tables for uniperk.eth offchain subdomains.
-- One row per subdomain (e.g. alice.uniperk.eth); texts stored as JSONB.

CREATE TABLE IF NOT EXISTS names (
  name TEXT NOT NULL PRIMARY KEY,
  owner TEXT NOT NULL,
  texts JSONB DEFAULT '{}',
  addresses JSONB DEFAULT '{}',
  contenthash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for "subdomain by address" lookups
CREATE INDEX IF NOT EXISTS idx_names_owner ON names (owner);

-- Optional: constraint so only *.uniperk.eth are allowed (enforce in app or here)
-- ALTER TABLE names ADD CONSTRAINT chk_name_suffix CHECK (name LIKE '%.uniperk.eth');

COMMENT ON TABLE names IS 'ENS offchain subdomains under uniperk.eth; name = full name e.g. alice.uniperk.eth';
COMMENT ON COLUMN names.texts IS 'JSON object: key -> value for text records (e.g. agent.uniperk.allowed)';
COMMENT ON COLUMN names.addresses IS 'JSON object: coinType -> address (e.g. "60" -> ETH address)';
