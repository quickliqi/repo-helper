import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GovernanceSettings, DEFAULT_GOVERNANCE } from '@/lib/calculations';

export function useGovernanceSettings() {
    return useQuery({
        queryKey: ['platform_settings'],
        queryFn: async (): Promise<GovernanceSettings> => {
            const { data, error } = await (supabase as any)
                .from('platform_settings')
                .select('key, value');

            if (error) {
                console.error('Error fetching settings:', error);
                return {};
            }

            // Map DB rows {key, value} to GovernanceSettings object
            const settings: any = {};
            data.forEach(row => {
                // keys in DB: default_closing_costs, etc.
                // keys in GovernanceSettings match these.
                // Value in DB is JSONB, so it might be just the number or object.
                // Assuming simple values for now based on previous steps.
                settings[row.key] = row.value;
            });

            return settings as GovernanceSettings;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}
