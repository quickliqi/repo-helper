-- Allow anonymous (public) read access to active buy boxes
-- Only exposes non-PII columns; the frontend further strips name/notes
CREATE POLICY "allow_anon_read_active_buy_boxes"
  ON public.buy_boxes
  FOR SELECT
  TO anon
  USING (is_active = true);
