CREATE POLICY "fuel-videos read" ON storage.objects FOR SELECT
  USING (bucket_id = 'fuel-videos');
CREATE POLICY "fuel-videos insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fuel-videos');
CREATE POLICY "fuel-videos update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'fuel-videos') WITH CHECK (bucket_id = 'fuel-videos');
CREATE POLICY "fuel-videos delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'fuel-videos');