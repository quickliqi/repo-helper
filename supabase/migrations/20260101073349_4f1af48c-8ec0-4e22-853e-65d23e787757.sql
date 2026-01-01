-- Add delete policy for verification requests (users can delete pending requests)
CREATE POLICY "Users can delete own pending verification requests"
ON public.verification_requests
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Add RLS policies for property_match_throttle (internal system table)
CREATE POLICY "System can manage throttle records"
ON public.property_match_throttle
FOR ALL
USING (true)
WITH CHECK (true);