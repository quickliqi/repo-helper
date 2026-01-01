import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ScrapeSubscriptionStatus {
  isSubscribed: boolean;
  creditsRemaining: number;
  creditsUsed: number;
  periodEnd: string | null;
  isLoading: boolean;
}

interface ScrapeSubscriptionContextType extends ScrapeSubscriptionStatus {
  refreshScrapeSubscription: () => Promise<void>;
  hasCredits: () => boolean;
}

const ScrapeSubscriptionContext = createContext<ScrapeSubscriptionContextType | undefined>(undefined);

export function ScrapeSubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<ScrapeSubscriptionStatus>({
    isSubscribed: false,
    creditsRemaining: 0,
    creditsUsed: 0,
    periodEnd: null,
    isLoading: true,
  });

  const fetchScrapeSubscription = useCallback(async () => {
    if (!user || role !== 'investor') {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-scrape-subscription');
      if (error) throw error;

      setStatus({
        isSubscribed: data?.subscribed || false,
        creditsRemaining: data?.credits_remaining || 0,
        creditsUsed: data?.credits_used || 0,
        periodEnd: data?.period_end || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching scrape subscription:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, role]);

  useEffect(() => {
    if (user && role === 'investor') {
      fetchScrapeSubscription();
    } else {
      setStatus({
        isSubscribed: false,
        creditsRemaining: 0,
        creditsUsed: 0,
        periodEnd: null,
        isLoading: false,
      });
    }
  }, [user, role, fetchScrapeSubscription]);

  const hasCredits = useCallback(() => {
    return status.isSubscribed && status.creditsRemaining > 0;
  }, [status.isSubscribed, status.creditsRemaining]);

  return (
    <ScrapeSubscriptionContext.Provider value={{
      ...status,
      refreshScrapeSubscription: fetchScrapeSubscription,
      hasCredits,
    }}>
      {children}
    </ScrapeSubscriptionContext.Provider>
  );
}

export function useScrapeSubscription() {
  const context = useContext(ScrapeSubscriptionContext);
  if (context === undefined) {
    throw new Error('useScrapeSubscription must be used within a ScrapeSubscriptionProvider');
  }
  return context;
}
