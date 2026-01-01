import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationBannerProps {
  showOnlyFor?: 'wholesaler' | 'investor' | 'all';
}

export function VerificationBanner({ showOnlyFor = 'all' }: VerificationBannerProps) {
  // Verification banner hidden - will be re-enabled with proper ID verification service later
  return null;
}
