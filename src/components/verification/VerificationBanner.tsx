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
  const { profile, role, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for dismissed state
    const dismissedKey = `verification-banner-dismissed-${profile?.user_id}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
    
    // Get current verification status
    if (profile) {
      setVerificationStatus(profile.verification_status || null);
    }
  }, [profile]);

  // Don't show if loading, dismissed, or no profile
  if (isLoading || dismissed || !profile) {
    return null;
  }

  // Don't show if already verified
  if (profile.verification_status === 'approved' || profile.is_verified) {
    return null;
  }

  // Check role filter
  if (showOnlyFor !== 'all' && role !== showOnlyFor) {
    return null;
  }

  const handleDismiss = () => {
    const dismissedKey = `verification-banner-dismissed-${profile.user_id}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  // Pending verification
  if (verificationStatus === 'pending') {
    return (
      <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-4">
        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Verification Pending</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Your identity verification is being reviewed. This usually takes 24-48 hours.
        </AlertDescription>
      </Alert>
    );
  }

  // Rejected verification
  if (verificationStatus === 'rejected') {
    return (
      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-800 dark:text-red-200">Verification Required</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>Your previous verification was not approved. Please try again with clearer documents.</span>
          <Button asChild size="sm" variant="outline" className="ml-4 border-red-300 text-red-700 hover:bg-red-100">
            <Link to="/verify">Try Again</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Not started verification
  return (
    <Alert className="bg-primary/5 border-primary/20 mb-4 relative">
      <Shield className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground">Complete Your Verification</AlertTitle>
      <AlertDescription className="text-muted-foreground flex items-center justify-between">
        <span>
          Verify your identity to unlock all features including messaging, posting deals, and contacting sellers.
        </span>
        <div className="flex items-center gap-2 ml-4">
          <Button asChild size="sm">
            <Link to="/verify">
              <Shield className="h-4 w-4 mr-1" />
              Get Verified
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
