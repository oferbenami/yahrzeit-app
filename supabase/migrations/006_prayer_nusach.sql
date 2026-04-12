-- Add prayer_nusach preference to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS prayer_nusach TEXT DEFAULT 'sephardi'
    CHECK (prayer_nusach IN ('sephardi', 'mizrahi', 'ashkenaz'));
