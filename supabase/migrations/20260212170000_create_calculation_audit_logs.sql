-- Create the calculation_audit_logs table
CREATE TABLE IF NOT EXISTS calculation_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  input_snapshot JSONB NOT NULL,
  output_snapshot JSONB NOT NULL,
  discrepancy_found BOOLEAN DEFAULT FALSE,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Optional: who triggered the calculation
);

-- Enable RLS
ALTER TABLE calculation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all logs
CREATE POLICY "Admins can view all audit logs" ON calculation_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin can insert logs (or system/service role)
CREATE POLICY "System can insert audit logs" ON calculation_audit_logs
  FOR INSERT
  WITH CHECK (true); -- Ideally restricted to service role or authenticated users triggering calcs

-- Create index for faster queries on discrepancies
CREATE INDEX idx_audit_logs_discrepancy ON calculation_audit_logs(discrepancy_found);
CREATE INDEX idx_audit_logs_property_id ON calculation_audit_logs(property_id);
