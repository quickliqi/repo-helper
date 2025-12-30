import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isSubscribed: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  listingCredits: number;
  isLoading: boolean;
}

interface SubscriptionContextType extends SubscriptionStatus {
  refreshSubscription: () => Promise<void>;
  hasAccess: () => boolean;
  hasCredits: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    isTrialing: false,
    trialEnd: null,
    subscriptionEnd: null,
    listingCredits: 0,
    isLoading: true,
  });

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      setStatus({
        isSubscribed: data?.subscribed || false,
        isTrialing: data?.trialing || false,
        trialEnd: data?.trial_end || null,
        subscriptionEnd: data?.subscription_end || null,
        listingCredits: data?.listing_credits || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    } else {
      setStatus({
        isSubscribed: false,
        isTrialing: false,
        trialEnd: null,
        subscriptionEnd: null,
        listingCredits: 0,
        isLoading: false,
      });
    }
  }, [user, fetchSubscriptionStatus]);

  // Auto-refresh every 60 seconds when user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchSubscriptionStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, fetchSubscriptionStatus]);

  const hasAccess = useCallback(() => {
    // Investors need active subscription or trial
    if (role === 'investor') {
      return status.isSubscribed || status.isTrialing;
    }
    // Wholesalers always have access (but need credits to post)
    return true;
  }, [role, status.isSubscribed, status.isTrialing]);

  const hasCredits = useCallback(() => {
    return status.listingCredits > 0;
  }, [status.listingCredits]);

  return (
    <SubscriptionContext.Provider value={{
      ...status,
      refreshSubscription: fetchSubscriptionStatus,
      hasAccess,
      hasCredits,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
