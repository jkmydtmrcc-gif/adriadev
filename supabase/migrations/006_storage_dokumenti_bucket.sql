-- Bucket za dokumente (privatni)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumenti', 'dokumenti', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: korisnik može pristupati samo datotekama u mapi svojih tvrtki (path: company_id/...)
CREATE POLICY "Dokumenti company path"
ON storage.objects FOR ALL
USING (
  bucket_id = 'dokumenti'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'dokumenti'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE user_id = auth.uid()
  )
);
