import { DealInput, DealSchema } from '../types/deal-types';
import { z } from 'zod';

/**
 * Data Validation Agent
 * Responsible for structural integrity and type safety of Deal data.
 */

export interface ValidationResult {
    success: boolean;
    data?: DealInput;
    errors: Record<string, string[]>; // Field -> Error Messages
}

export function validateDealData(data: unknown): ValidationResult {
    const result = DealSchema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data,
            errors: {}
        };
    }

    // Format Zod errors into a readable structure
    const formattedErrors: Record<string, string[]> = {};

    result.error.issues.forEach((issue) => {
        const field = issue.path.join('.') || 'general';
        if (!formattedErrors[field]) {
            formattedErrors[field] = [];
        }
        formattedErrors[field].push(issue.message);
    });

    return {
        success: false,
        errors: formattedErrors
    };
}
