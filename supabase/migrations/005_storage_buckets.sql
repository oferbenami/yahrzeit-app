-- Storage buckets for deceased photos and gravestone photos
-- Run this in: Supabase Dashboard → SQL Editor

-- 1. Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deceased-photos',
  'deceased-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users can upload their own deceased photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own deceased photos"  ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own deceased photos"  ON storage.objects;
DROP POLICY IF EXISTS "Public read deceased photos"                 ON storage.objects;

-- 3. Public read (bucket is public)
CREATE POLICY "Public read deceased photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'deceased-photos');

-- 4. Authenticated users can upload
CREATE POLICY "Users can upload deceased photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'deceased-photos');

-- 5. Authenticated users can update/delete their own files
CREATE POLICY "Users can update deceased photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'deceased-photos' AND auth.uid() = owner);

CREATE POLICY "Users can delete deceased photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'deceased-photos' AND auth.uid() = owner);
