import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BuyBox } from '@/types/database';
import { calculateFitScore, MatchResult } from '@/lib/matching-engine';
import { DealMetrics } from '@/types/deal-types';
import { Property } from '@/types/database';

export function useInvestorContext() {
    const { user } = useAuth();
    const [buyBox, setBuyBox] = useState<BuyBox | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBuyBox() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('buy_boxes')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching buy box:', error);
                } else {
                    setBuyBox(data as BuyBox);
                }
            } catch (err) {
                console.error('Failed to fetch buy box context:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBuyBox();
    }, [user]);

    /**
     * Evaluates a property against the current user's buy box.
     * Returns null if no buy box is active or user is not logged in.
     */
    const evaluateDeal = (deal: Property, metrics: DealMetrics | null): MatchResult | null => {
        if (!buyBox) return null;
        return calculateFitScore(deal, metrics, buyBox);
    };

    return {
        buyBox,
        isLoading,
        evaluateDeal
    };
}
