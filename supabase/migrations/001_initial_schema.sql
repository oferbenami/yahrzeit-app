-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  notification_prefs JSONB DEFAULT '{"email": true, "sms": false, "push": true, "whatsapp": false, "days_before": [30, 7, 1, 0]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: family_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: group_members
-- ============================================================
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'member');

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- ============================================================
-- TABLE: deceased
-- ============================================================
CREATE TYPE IF NOT EXISTS relationship_degree AS ENUM ('first', 'second', 'extended');

CREATE TABLE IF NOT EXISTS public.deceased (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  birth_date_gregorian DATE,
  birth_date_hebrew TEXT,
  death_date_gregorian DATE NOT NULL,
  death_date_hebrew TEXT NOT NULL,
  death_date_hebrew_day INT NOT NULL CHECK (death_date_hebrew_day BETWEEN 1 AND 30),
  death_date_hebrew_month INT NOT NULL CHECK (death_date_hebrew_month BETWEEN 1 AND 13),
  cemetery_name TEXT,
  cemetery_block TEXT,
  cemetery_plot TEXT,
  cemetery_notes TEXT,
  gravestone_photo_url TEXT,
  relationship_label TEXT,
  relationship_degree relationship_degree,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deceased_updated_at
  BEFORE UPDATE ON public.deceased
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: yahrzeit_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.yahrzeit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deceased_id UUID NOT NULL REFERENCES public.deceased(id) ON DELETE CASCADE,
  hebrew_year INT NOT NULL,
  yahrzeit_date_gregorian DATE NOT NULL,
  yahrzeit_date_hebrew TEXT NOT NULL,
  shabbat_eve_before DATE,
  notifications_sent JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deceased_id, hebrew_year)
);

-- ============================================================
-- TABLE: reminder_schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reminder_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deceased_id UUID NOT NULL REFERENCES public.deceased(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  days_before INT[] NOT NULL DEFAULT '{30,7,1,0}',
  channels TEXT[] NOT NULL DEFAULT '{"email","push"}',
  custom_message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(deceased_id, user_id)
);

-- ============================================================
-- TABLE: gathering_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gathering_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deceased_id UUID NOT NULL REFERENCES public.deceased(id) ON DELETE CASCADE,
  yahrzeit_date DATE NOT NULL,
  location_name TEXT,
  location_address TEXT,
  meeting_time TIMETZ,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ical_uid TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_deceased_group ON public.deceased(group_id);
CREATE INDEX IF NOT EXISTS idx_yahrzeit_events_deceased ON public.yahrzeit_events(deceased_id);
CREATE INDEX IF NOT EXISTS idx_yahrzeit_events_date ON public.yahrzeit_events(yahrzeit_date_gregorian);
CREATE INDEX IF NOT EXISTS idx_reminder_schedule_user ON public.reminder_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON public.family_groups(invite_code);
