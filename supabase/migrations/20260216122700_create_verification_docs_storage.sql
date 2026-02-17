-- Migration to create verification-docs storage bucket and RLS policies

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the bucket (it's already enabled by default on storage.objects)

-- 3. Create policies for the bucket

-- Allow any authenticated user to upload files
-- We use authenticated because they just signed up and should have a session
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-docs');

-- Allow admins to read all files in the bucket
CREATE POLICY "Allow admin read access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete/update files (optional but good for management)
CREATE POLICY "Allow admin management"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'verification-docs' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'verification-docs' AND
  public.has_role(auth.uid(), 'admin')
);

-- 4. Add a column to profiles to store the document path
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_document_url TEXT;
