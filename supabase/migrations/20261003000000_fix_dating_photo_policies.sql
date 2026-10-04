-- Drop old policies that use owner (which may fail if owner is not correctly populated)
DROP POLICY IF EXISTS "Users can upload their own dating photos." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own dating photos." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own dating photos." ON storage.objects;

-- Create new policies using the folder name check (which is guaranteed to match the auth.uid() in the upload path)
CREATE POLICY "Users can upload their own dating photos." 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'dating_photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own dating photos." 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'dating_photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own dating photos." 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'dating_photos' AND (storage.foldername(name))[1] = auth.uid()::text);
