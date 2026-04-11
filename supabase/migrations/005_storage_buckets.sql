-- Storage buckets for deceased photos and gravestone photos
-- Run this in Supabase SQL editor or via supabase db push

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'deceased-photos',
    'deceased-photos',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO NOTHING;

-- RLS: allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own deceased photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deceased-photos'
    AND (storage.foldername(name))[1] IN (auth.uid()::text, 'gravestone')
  );

-- RLS: allow authenticated users to update/delete their own files
CREATE POLICY "Users can update their own deceased photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'deceased-photos'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete their own deceased photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deceased-photos'
    AND owner = auth.uid()
  );

-- RLS: public read (bucket is public)
CREATE POLICY "Public read deceased photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'deceased-photos');
