-- RLS policies for the 'stash-media' storage bucket (video/audio), enforcing
-- a <userId>/<filename> path convention. storage.objects already has RLS
-- enabled by default in this Supabase project (not managed by Prisma), so
-- only policies are added here. Mirrors 20260820213000_add_stash_covers_storage_policies.

-- Anyone can read stash media files, matching the bucket's public setting.
CREATE POLICY "Public read access for stash-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'stash-media');

-- A user may only upload objects under their own <userId>/ folder.
CREATE POLICY "Users can upload their own stash media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stash-media'
  AND (select auth.uid()::text) = (storage.foldername(name))[1]
);

-- A user may only overwrite objects under their own <userId>/ folder.
CREATE POLICY "Users can update their own stash media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'stash-media'
  AND (select auth.uid()::text) = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'stash-media'
  AND (select auth.uid()::text) = (storage.foldername(name))[1]
);

-- A user may only delete objects under their own <userId>/ folder.
CREATE POLICY "Users can delete their own stash media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'stash-media'
  AND (select auth.uid()::text) = (storage.foldername(name))[1]
);
