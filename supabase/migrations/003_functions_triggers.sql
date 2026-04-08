-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- GENERATE UNIQUE INVITE CODE
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INT;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT COUNT(*) INTO exists_check
    FROM public.family_groups WHERE invite_code = code;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STORAGE BUCKETS (run once in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('deceased-photos', 'deceased-photos', true)
-- ON CONFLICT DO NOTHING;

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gravestone-photos', 'gravestone-photos', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================
-- CREATE POLICY "Authenticated users can upload deceased photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'deceased-photos' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Anyone can view deceased photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'deceased-photos');

-- CREATE POLICY "Owners can delete deceased photos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'deceased-photos' AND auth.uid()::text = owner);
