
import { DealMetrics } from "./types.ts";

// Constants for default assumptions
export const DEFAULT_GOVERNANCE = {
    CLOSING_COSTS_PERCENT: 0.03,
    HOLDING_COSTS_PERCENT: 0.02,
    MAO_DISCOUNT_RATE: 0.70, // Standard 70% rule
    TARGET_ROI_FLIP: 0.15,
    WHOLESALE_FEE_DEFAULT: 5000,
    LOW_EQUITY_THRESHOLD: 10,
    HIGH_ROI_WARNING_THRESHOLD: 200
};

export interface GovernanceSettings {
    default_closing_costs?: number;
    default_holding_costs?: number;
    max_allowable_offer_factor?: number;
    high_roi_threshold?: number;
    low_equity_threshold?: number;
}

export interface DealInput {
    asking_price: number;
    arv?: number;
    repair_estimate?: number;
    assignment_fee?: number;
    condition?: string;
    sqft?: number;
}

/**
 * Calculates all key metrics for a deal.
 * Returns null if critical data (like asking price) is missing.
 */
export function calculateDealMetrics(
    deal: DealInput,
    settings: GovernanceSettings = {}
): DealMetrics | null {
    if (!deal.asking_price) return null;

    const arv = deal.arv || deal.asking_price; // Fallback to asking if ARV not set
    const repairs = deal.repair_estimate || 0;
    const assignment = deal.assignment_fee || 0;

    // Apply Governance Settings or Defaults
    const closingCostsPercent = settings.default_closing_costs ?? DEFAULT_GOVERNANCE.CLOSING_COSTS_PERCENT;
    const holdingCostsPercent = settings.default_holding_costs ?? DEFAULT_GOVERNANCE.HOLDING_COSTS_PERCENT;
    const maoFactor = settings.max_allowable_offer_factor ?? DEFAULT_GOVERNANCE.MAO_DISCOUNT_RATE;

    // 1. Equity Calculations
    const totalCostBasis = deal.asking_price + repairs + assignment;
    const grossEquity = arv - totalCostBasis;
    const equityPercentage = arv > 0 ? (grossEquity / arv) * 100 : 0;

    // 2. MAO (Maximum Allowable Offer) Calculation
    const standardMao = (arv * maoFactor) - repairs - assignment;

    // 3. ROI Calculation
    const closingCosts = arv * closingCostsPercent;
    const holdingCosts = arv * holdingCostsPercent;
    const totalInvested = deal.asking_price + repairs + assignment + closingCosts + holdingCosts;
    const projectedProfit = arv - totalInvested;
    const roi = totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;

    // 4. Deal Score (Simple Heuristic)
    let score = 50; // Base
    if (equityPercentage > 20) score += 20;
    if (equityPercentage > 30) score += 10;
    if (roi > 15) score += 10;
    if (roi > 30) score += 10;
    if (deal.condition === 'distressed' || deal.condition === 'poor') score -= 10;

    score = Math.max(0, Math.min(100, score));

    // Risk Factors
    const riskFactors: string[] = [];
    if (!deal.arv) riskFactors.push("ARV is missing; using Asking Price as proxy.");

    const lowEquityThresh = settings.low_equity_threshold ?? DEFAULT_GOVERNANCE.LOW_EQUITY_THRESHOLD;
    if (equityPercentage < lowEquityThresh) riskFactors.push(`Low equity margin (<${lowEquityThresh}%).`);

    if (repairs === 0 && deal.condition !== 'excellent') riskFactors.push("No repair estimate provided.");

    return {
        grossEquity,
        equityPercentage,
        mao: standardMao,
        projectedProfit,
        roi,
        cashOnCashCount: null,
        score,
        riskFactors
    };
}
