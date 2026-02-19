import type { AuditReport } from "@/types/scraper-audit-types";

// ─── Data Integrity (Triangulation Engine) ────────────────────────
export interface DataIntegrity {
    confidence_score: number;
    verified_matches: Record<string, any>;
    discrepancies: Record<string, { source_a: any; source_b: any }>;
}

// ─── Deal Metrics ──────────────────────────────────────────────────
export interface DealMetrics {
    arv: number;
    mao: number;
    roi: number;
    equityPercentage: number;
    score: number;
    riskFactors: string[];
    grossEquity: number;
    projectedProfit: number;
}

// ─── Deal Detail ───────────────────────────────────────────────────
export interface DealDetail {
    title: string;
    price: number;
    location: string;
    source: string;
    description: string;
    link: string;
    ai_score: number;
    reasoning: string;
    metrics: DealMetrics | null;
    validated: boolean;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    property_type?: string;
    condition?: string;
    image?: string;
    integrity?: DataIntegrity;
}

// ─── Modal Payload Union ───────────────────────────────────────────
export type AnalyzerContextType = "deal" | "audit";

export type AnalyzerPayload = DealDetail | AuditReport;
