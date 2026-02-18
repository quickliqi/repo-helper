import { z } from 'zod';
import { PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS, STATUS_LABELS } from './database';

export const PropertyTypeEnum = z.enum([
    'single_family', 'multi_family', 'condo', 'townhouse',
    'commercial', 'land', 'mobile_home', 'other'
]);

export const DealTypeEnum = z.enum([
    'fix_and_flip', 'buy_and_hold', 'wholesale',
    'subject_to', 'seller_finance', 'other'
]);

export const ConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor', 'distressed']);
export const StatusEnum = z.enum(['active', 'under_contract', 'pending', 'sold', 'withdrawn']);

// Core schemas
export const AddressSchema = z.object({
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid Zip Code"),
});

export const PropertyDetailsSchema = z.object({
    property_type: PropertyTypeEnum,
    deal_type: DealTypeEnum,
    condition: ConditionEnum,
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().nonnegative().optional(),
    sqft: z.number().int().positive("SqFt must be positive").optional(),
    lot_size_sqft: z.number().int().nonnegative().optional(),
    year_built: z.number().int().min(1800).max(new Date().getFullYear() + 1).optional(),
});

export const FinancialsSchema = z.object({
    asking_price: z.number().positive("Asking price must be positive"),
    arv: z.number().positive("ARV must be positive").optional(),
    repair_estimate: z.number().nonnegative("Repair estimate cannot be negative").optional(),
    assignment_fee: z.number().nonnegative().optional(),
});

// Comprehensive Deal Schema used for Validation Agent
export const DealSchema = AddressSchema
    .merge(PropertyDetailsSchema)
    .merge(FinancialsSchema)
    .extend({
        id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        title: z.string().min(5, "Title is too short"),
        description: z.string().optional(),
        listing_url: z.string().url().optional(),
        image_urls: z.array(z.string().url()).optional(),
        status: StatusEnum.default('active'),
    });

export type DealInput = z.infer<typeof DealSchema>;

// Calculation Outputs
export interface DealMetrics {
    grossEquity: number;
    equityPercentage: number; // 0-100
    mao: number; // Maximum Allowable Offer
    projectedProfit: number;
    roi: number; // Return on Investment %
    cashOnCashCount: number | null; // Null if not applicable/calculable
    breakEvenTimelineMonths?: number;
    score: number; // 0-100 Deal Score
    riskFactors: string[];
}

export interface GovernanceResult {
    isValid: boolean;
    validationErrors: string[];
    metrics: DealMetrics | null;
    confidenceScore: number; // 0-100
    flags: {
        level: 'info' | 'warning' | 'critical';
        message: string;
    }[];
}
