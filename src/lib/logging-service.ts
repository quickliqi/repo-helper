import { supabase } from '@/integrations/supabase/client';
import { GovernanceResult, DealInput } from '../types/deal-types';

/**
 * Service to log calculation events to the database.
 * This runs asynchronously to avoid blocking the UI.
 */
export const LoggingService = {
    async logCalculationEvent(
        propertyId: string | undefined, // Might be undefined for new deal creation
        input: DealInput,
        result: GovernanceResult,
        userId?: string
    ) {
        // Only log if we have a property ID (persisted deal) OR if there are critical errors
        // to avoid spamming logs for every keystroke in a calculator form.
        const shouldLog = propertyId || result.flags.some(f => f.level === 'warning' || f.level === 'critical');

        if (!shouldLog) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('calculation_audit_logs')
                .insert({
                    property_id: propertyId || null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    input_snapshot: input as any, // Cast for JSONB
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    output_snapshot: result as any, // Cast for JSONB
                    discrepancy_found: !result.isValid,
                    severity: result.flags.find(f => f.level === 'critical') ? 'critical' :
                        result.flags.find(f => f.level === 'warning') ? 'warning' : 'info',
                    user_id: userId
                });

            if (error) {
                console.error('Failed to log calculation event:', error);
            }
        } catch (err) {
            console.error('Error in LoggingService:', err);
        }
    }
};
