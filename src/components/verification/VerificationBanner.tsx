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
  const { profile, role } = useAuth();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      checkPendingRequest();
    }
  }, [profile?.user_id]);

  const checkPendingRequest = async () => {
    if (!profile?.user_id) return;
    
    const { data } = await supabase
      .from('verification_requests')
      .select('status')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setHasPendingRequest(data?.status === 'pending');
  };

  // Don't show if user role doesn't match filter
  if (showOnlyFor !== 'all' && role !== showOnlyFor) return null;
  
  // Don't show if already verified
  if (profile?.verification_status === 'approved' || profile?.is_verified) return null;
  
  // Don't show if dismissed
  if (dismissed) return null;

  // Show pending status
  if (hasPendingRequest) {
    return (
      <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-700 dark:text-yellow-400">Verification Pending</AlertTitle>
        <AlertDescription className="text-yellow-600 dark:text-yellow-300">
          Your identity verification is being reviewed. This usually takes 1-2 business days.
        </AlertDescription>
      </Alert>
    );
  }

  // Show rejected status
  if (profile?.verification_status === 'rejected') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Verification Rejected</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your verification was not approved. Please submit new documents.</span>
          <Button asChild size="sm" variant="outline" className="ml-4">
            <Link to="/verify">Resubmit</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show call to action for unverified users
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5 relative">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <Shield className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">Verify Your Identity</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="text-muted-foreground">
          {role === 'wholesaler' 
            ? 'Complete identity verification to post deals and connect with investors.'
            : 'Complete identity verification to contact sellers and access full platform features.'}
        </span>
        <Button asChild size="sm" className="ml-4">
          <Link to="/verify">
            <Shield className="h-4 w-4 mr-2" />
            Get Verified
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
