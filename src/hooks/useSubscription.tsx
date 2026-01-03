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
    // Only fetch if user is authenticated
    if (!user?.id) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch credits + subscription directly from the database (avoids JWT issues with the check-subscription function)
      const [creditsRes, subscriptionRes] = await Promise.all([
        supabase
          .from('listing_credits')
          .select('credits_remaining')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('status, trial_ends_at, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (creditsRes.error) {
        console.error('Error fetching listing credits:', creditsRes.error);
      }
      if (subscriptionRes.error) {
        console.error('Error fetching subscription record:', subscriptionRes.error);
      }

      const listingCredits = creditsRes.data?.credits_remaining ?? 0;
      const subscription = subscriptionRes.data;

      const trialEnd = subscription?.trial_ends_at ?? null;
      const subscriptionEnd = subscription?.current_period_end ?? null;
      const now = Date.now();

      const isTrialing =
        subscription?.status === 'trialing' &&
        !!trialEnd &&
        new Date(trialEnd).getTime() > now;

      const isSubscribed = subscription?.status === 'active';

      setStatus({
        isSubscribed,
        isTrialing,
        trialEnd,
        subscriptionEnd,
        listingCredits,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setStatus({
        isSubscribed: false,
        isTrialing: false,
        trialEnd: null,
        subscriptionEnd: null,
        listingCredits: 0,
        isLoading: false,
      });
    }
  }, [user?.id]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user?.id) {
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
  }, [user?.id, fetchSubscriptionStatus]);

  // Auto-refresh every 60 seconds when user is logged in
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchSubscriptionStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.id, fetchSubscriptionStatus]);

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
