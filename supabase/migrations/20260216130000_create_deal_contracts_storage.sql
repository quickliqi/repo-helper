-- Migration to create deal-contracts and proof-of-funds storage buckets and RLS policies

-- 1. Create the buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('deal-contracts', 'deal-contracts', false),
  ('proof-of-funds', 'proof-of-funds', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Add contract_url to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- 3. RLS Policies for deal-contracts

-- Allow authenticated users (Wholesalers) to upload contracts
CREATE POLICY "Allow authenticated uploads to deal-contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deal-contracts');

-- Allow owners to view their own contracts
CREATE POLICY "Allow owners to view own contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-contracts' AND
  (auth.uid() = owner)
);

-- Allow admins to view all contracts
CREATE POLICY "Allow admin read access to deal-contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-contracts' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to manage contracts
CREATE POLICY "Allow admin management of deal-contracts"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'deal-contracts' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'deal-contracts' AND
  public.has_role(auth.uid(), 'admin')
);

-- 4. RLS Policies for proof-of-funds

-- Allow authenticated users (Investors) to upload proof of funds
CREATE POLICY "Allow authenticated uploads to proof-of-funds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proof-of-funds');

-- Allow owners to view their own proof of funds
CREATE POLICY "Allow owners to view own proof-of-funds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proof-of-funds' AND
  (auth.uid() = owner)
);

-- Allow admins to view all proof of funds
CREATE POLICY "Allow admin read access to proof-of-funds"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proof-of-funds' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to manage proof of funds
CREATE POLICY "Allow admin management of proof-of-funds"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'proof-of-funds' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'proof-of-funds' AND
  public.has_role(auth.uid(), 'admin')
);
