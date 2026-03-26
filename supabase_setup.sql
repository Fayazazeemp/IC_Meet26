-- ================================================================
-- Islamic Campus Meetup 2026 — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone           TEXT UNIQUE NOT NULL,
  name            TEXT,
  fathers_name    TEXT,
  email           TEXT,
  college         TEXT,
  course          TEXT,
  year            TEXT,
  area            TEXT,
  unit            TEXT,
  panchayat       TEXT,
  role            TEXT,
  instagram       TEXT,
  photo_url       TEXT,
  source          TEXT DEFAULT 'new',   -- 'csv' = pre-filled, 'new' = walk-in
  registered_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 4. Policy: anyone can INSERT (register)
CREATE POLICY "Allow public registration"
  ON registrations FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Policy: anyone can SELECT (needed for duplicate check + admin)
--    For production, restrict this to authenticated admin only.
CREATE POLICY "Allow public read"
  ON registrations FOR SELECT
  TO anon
  USING (true);

-- 6. Policy: allow delete (for admin dashboard)
CREATE POLICY "Allow public delete"
  ON registrations FOR DELETE
  TO anon
  USING (true);

-- ================================================================
-- OPTIONAL: Seed with a test entry to verify setup
-- ================================================================
-- INSERT INTO registrations (phone, name, college, role, source)
-- VALUES ('+919999999999', 'Test Student', 'Test College', 'Member', 'new');
-- SELECT * FROM registrations;
-- DELETE FROM registrations WHERE phone = '+919999999999';
