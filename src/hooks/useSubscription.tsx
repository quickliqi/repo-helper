import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isSubscribed: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  listingCredits: number;
  scrapeCredits: number;
  planTier: 'basic' | 'pro' | null;
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
    scrapeCredits: 0,
    planTier: null,
    isLoading: true,
  });

  const fetchSubscriptionStatus = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user?.id) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Admin bypass — full access without needing Edge Function
    if (role === 'admin') {
      setStatus({
        isSubscribed: true,
        isTrialing: false,
        trialEnd: null,
        subscriptionEnd: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        listingCredits: 999,
        scrapeCredits: 999,
        planTier: 'pro',
        isLoading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        // Handle gracefully - user might not have subscription
        console.error('Error fetching subscription status:', error);
        setStatus({
          isSubscribed: false,
          isTrialing: false,
          trialEnd: null,
          subscriptionEnd: null,
          listingCredits: 0,
          scrapeCredits: 0,
          planTier: null,
          isLoading: false,
        });
        return;
      }

      setStatus({
        isSubscribed: data?.subscribed || false,
        isTrialing: data?.trialing || false,
        trialEnd: data?.trial_end || null,
        subscriptionEnd: data?.subscription_end || null,
        listingCredits: data?.listing_credits || 0,
        scrapeCredits: data?.scrape_credits || 0,
        planTier: data?.plan_tier || null,
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
        scrapeCredits: 0,
        planTier: null,
        isLoading: false,
      });
    }
  }, [user?.id, role]);

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
        scrapeCredits: 0,
        planTier: null,
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
    return status.listingCredits > 0 || status.scrapeCredits > 0;
  }, [status.listingCredits, status.scrapeCredits]);

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
