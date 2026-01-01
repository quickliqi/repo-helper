-- Add explicit policies to prevent direct user manipulation of payment_history
-- All modifications should happen via edge functions with service role

-- Create policy to explicitly deny INSERT from regular users
-- (Service role bypasses RLS, so edge functions can still insert)
CREATE POLICY "Only service role can insert payments" 
ON public.payment_history 
FOR INSERT 
WITH CHECK (false);

-- Create policy to explicitly deny UPDATE from regular users
CREATE POLICY "Only service role can update payments" 
ON public.payment_history 
FOR UPDATE 
USING (false);

-- Create policy to explicitly deny DELETE from regular users
CREATE POLICY "Only service role can delete payments" 
ON public.payment_history 
FOR DELETE 
USING (false);