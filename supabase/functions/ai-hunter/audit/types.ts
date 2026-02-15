
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ─── Deal Metrics (from deal-types.ts) ─────────────────────────────
export interface DealMetrics {
    grossEquity: number;
    equityPercentage: number;
    mao: number;
    projectedProfit: number;
    roi: number;
    cashOnCashCount: number | null;
    breakEvenTimelineMonths?: number;
    score: number;
    riskFactors: string[];
}

// ─── Normalized scraped deal shape ─────────────────────────────────
export const ScrapedDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    price: z.number().positive("Price must be positive"),
    location: z.string().min(1),
    source: z.enum(["MLS", "Craigslist FSBO", "Probate Records", "Facebook Marketplace", "Other", "AI Market Analysis"]),
    link: z.string().url("Must be a valid URL").optional(),
    description: z.string().optional(),
    ai_score: z.number().min(0).max(100).optional(),
    reasoning: z.string().optional(),

    // Structured fields (from MLS API or AI extraction)
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    asking_price: z.number().positive().optional(),
    arv: z.number().positive().optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().nonnegative().optional(),
    sqft: z.number().int().positive().optional(),
    lot_size_sqft: z.number().int().nonnegative().optional(),
    year_built: z.number().int().min(1800).max(2030).optional(),
    property_type: z.enum([
        'single_family', 'multi_family', 'condo', 'townhouse',
        'commercial', 'land', 'mobile_home', 'other'
    ]).optional(),
    deal_type: z.enum([
        'fix_and_flip', 'buy_and_hold', 'wholesale',
        'subject_to', 'seller_finance', 'other'
    ]).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor', 'distressed']).optional(),
    repair_estimate: z.number().nonnegative().optional(),
    equity_percentage: z.number().optional(),
});

export type ScrapedDeal = z.infer<typeof ScrapedDealSchema>;

// ─── Scraper Config Types ──────────────────────────────────────────
export interface ScraperConfig {
    passThreshold: number;
    dedup_price_variance: number;
}

export interface RelevanceConfig {
    relevanceThreshold: number;
    minDescriptionLength: number;
    minRequiredFields: number;
}

// ─── Agent Reports ─────────────────────────────────────────────────

export interface FieldIssue {
    field: string;
    issue: 'missing' | 'out_of_range' | 'wrong_type' | 'suspicious';
    message: string;
    suggestedFix?: string;
}

export interface IntegrityReport {
    dealIndex: number;
    title: string;
    completenessScore: number;      // 0-100
    plausibilityScore: number;      // 0-100
    overallScore: number;           // 0-100
    missingFields: string[];
    rangeViolations: FieldIssue[];
    isDuplicate: boolean;
    duplicateOf?: number;           // index of the duplicate
}

export interface RelevanceReport {
    totalDeals: number;
    relevantCount: number;
    irrelevantCount: number;
    perDeal: {
        dealIndex: number;
        title: string;
        fitScore: number;
        isRelevant: boolean;
        matchedBuyBoxId?: string;
        reasons: string[];
    }[];
    alignmentSummary: string;
}

export interface StructuralCorrection {
    field: string;
    from: unknown;
    to: unknown;
    reason: string;
}

export interface StructuralReport {
    totalDeals: number;
    validCount: number;
    invalidCount: number;
    complianceScore: number;        // 0-100
    perDeal: {
        dealIndex: number;
        title: string;
        isValid: boolean;
        errors: Record<string, string[]>;
        corrections: StructuralCorrection[];
    }[];
}

export interface CrossCheckReport {
    totalDeals: number;
    mismatchCount: number;
    perDeal: {
        dealIndex: number;
        title: string;
        mismatches: {
            field: string;
            reportedValue: number;
            calculatedValue: number;
            deviationPercent: number;
        }[];
        driftFlags: string[];
    }[];
    recommendations: string[];
}

export interface AuditAlert {
    severity: 'info' | 'warning' | 'critical';
    agentName: string;
    dealIndex?: number;
    dealTitle?: string;
    message: string;
    suggestedFix?: string;
}

export interface AuditReport {
    timestamp: string;
    sessionId?: string;
    totalDeals: number;
    overallScore: number;           // 0-100
    pass: boolean;
    integrity: IntegrityReport[];
    structural: StructuralReport;
    relevance: RelevanceReport;
    crossCheck: CrossCheckReport;
    alerts: AuditAlert[];
}

export interface BuyBoxForAudit {
    id: string;
    name: string;
    property_types: string[];
    deal_types: string[];
    min_price: number | null;
    max_price: number | null;
    min_arv: number | null;
    max_arv: number | null;
    min_equity_percentage: number | null;
    target_cities: string[];
    target_states: string[];
    target_zip_codes: string[];
    preferred_conditions: string[];
}
