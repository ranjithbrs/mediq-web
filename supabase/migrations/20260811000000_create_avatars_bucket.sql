-- Create avatars storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Delete Avatars" ON storage.objects;

-- Allow public read access to avatars bucket
CREATE POLICY "Public Read Avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatar images
CREATE POLICY "Authenticated User Upload Avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatar images
CREATE POLICY "Authenticated User Update Avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to delete avatar images
CREATE POLICY "Authenticated User Delete Avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
