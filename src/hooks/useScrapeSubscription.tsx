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
    // Only fetch if user is authenticated and is an investor
    if (!user?.id || role !== 'investor') {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get current session to ensure we have a valid token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-scrape-subscription');
      
      if (error) {
        // Handle gracefully - user might not have subscription
        console.error('Error fetching scrape subscription:', error);
        setStatus({
          isSubscribed: false,
          creditsRemaining: 0,
          creditsUsed: 0,
          periodEnd: null,
          isLoading: false,
        });
        return;
      }

      setStatus({
        isSubscribed: data?.subscribed || false,
        creditsRemaining: data?.credits_remaining || 0,
        creditsUsed: data?.credits_used || 0,
        periodEnd: data?.period_end || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching scrape subscription:', error);
      setStatus({
        isSubscribed: false,
        creditsRemaining: 0,
        creditsUsed: 0,
        periodEnd: null,
        isLoading: false,
      });
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (user?.id && role === 'investor') {
      fetchScrapeSubscription();
    } else if (role && role !== 'investor') {
      // User has a role but not investor - stop loading
      setStatus({
        isSubscribed: false,
        creditsRemaining: 0,
        creditsUsed: 0,
        periodEnd: null,
        isLoading: false,
      });
    } else if (!user) {
      // No user - stop loading
      setStatus({
        isSubscribed: false,
        creditsRemaining: 0,
        creditsUsed: 0,
        periodEnd: null,
        isLoading: false,
      });
    }
  }, [user?.id, role, fetchScrapeSubscription]);

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
