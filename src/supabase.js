import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// New publishable key (sb_publishable_...) with fallback to legacy anon key
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidKey = (key) => {
  if (!key) return false
  // New publishable key format
  if (key.startsWith('sb_publishable_')) return true
  // Legacy anon key format (JWT starting with eyJ)
  if (key.startsWith('eyJ')) return true
  return false
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-project') &&
  isValidKey(supabaseKey)
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database schema - Run this SQL in Supabase SQL Editor.
// BSG reuses the same Supabase project as KCG, so all tables are prefixed
// bsg_ to live alongside the KCG tables without colliding.
/*

-- Members table (your team contacts).
-- group_tag identifies the behind-the-scenes group:
--   'b'   = Byakuren (Young Women)
--   's'   = Sokahan        (Young Men)
--   'g'   = Gajokai        (Young Men)
--   's/g' = both Sokahan and Gajokai
CREATE TABLE bsg_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  color TEXT DEFAULT '#6366f1',
  group_tag TEXT DEFAULT 'b',  -- 'b' | 's' | 'g' | 's/g'
  region_name TEXT NOT NULL DEFAULT 'central_texas',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL  -- soft delete timestamp
);

CREATE INDEX idx_bsg_members_deleted_at ON bsg_members(deleted_at);
CREATE INDEX idx_bsg_members_region_active ON bsg_members(region_name) WHERE deleted_at IS NULL;

-- Region city mappings power the selector. Add more rows to support more regions.
CREATE TABLE bsg_region_cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_name TEXT NOT NULL,
  city TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO bsg_region_cities (region_name, city) VALUES
  ('central_texas', 'austin'),
  ('central_texas', 'killeen'),
  ('central_texas', 'waco');

-- View: only active (non-deleted) members
CREATE OR REPLACE VIEW bsg_active_members WITH (security_invoker = true) AS
  SELECT id, name, email, phone, color, group_tag, created_at, region_name
  FROM bsg_members
  WHERE deleted_at IS NULL;

GRANT SELECT ON bsg_active_members TO anon, authenticated;

-- Shifts table (calendar assignments)
CREATE TABLE bsg_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES bsg_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  region_name TEXT NOT NULL DEFAULT 'central_texas',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bsg_shifts_region_date ON bsg_shifts(region_name, shift_date);

-- History table (audit log)
CREATE TABLE bsg_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES bsg_members(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  shift_date DATE,  -- NULL for member_removed/member_restored actions
  action TEXT NOT NULL, -- 'assigned', 'cancelled', 'member_removed', 'member_restored'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Allow all for simplicity (no auth)
ALTER TABLE bsg_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsg_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsg_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsg_region_cities ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (since no auth required)
CREATE POLICY "Allow all" ON bsg_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bsg_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bsg_history FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON bsg_region_cities TO anon, authenticated;
CREATE POLICY "Public region map is readable" ON bsg_region_cities FOR SELECT TO anon, authenticated USING (true);

-- Insert some sample members
INSERT INTO bsg_members (name, email, phone, color, group_tag) VALUES
  ('Sally', NULL, NULL, '#ec4899', 'b'),
  ('Koichi Onogi', NULL, NULL, '#6366f1', 's/g'),
  ('Mika', NULL, NULL, '#14b8a6', 'b'),
  ('Taro', NULL, NULL, '#f59e0b', 's'),
  ('Ken', NULL, NULL, '#3b82f6', 'g');

*/
