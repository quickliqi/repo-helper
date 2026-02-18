
import { DealMetrics } from "./types.ts";
import {
    sanitizeNumber,
    calculateEquityPercentage,
    calculateMAO,
    calculateROI,
    calculateDealScore,
    calculateGrossEquity
} from "../../_shared/dealMath.ts";

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
    const askPrice = sanitizeNumber(deal.asking_price);
    if (askPrice <= 0) return null;

    const arv = sanitizeNumber(deal.arv || askPrice); // Fallback to asking if ARV not set
    const repairs = sanitizeNumber(deal.repair_estimate);
    const assignment = sanitizeNumber(deal.assignment_fee);

    // Apply Governance Settings or Defaults
    const closingCostsPercent = settings.default_closing_costs ?? DEFAULT_GOVERNANCE.CLOSING_COSTS_PERCENT;
    const holdingCostsPercent = settings.default_holding_costs ?? DEFAULT_GOVERNANCE.HOLDING_COSTS_PERCENT;
    const maoFactor = settings.max_allowable_offer_factor ?? DEFAULT_GOVERNANCE.MAO_DISCOUNT_RATE;

    // 1. Equity Calculations
    const totalCostBasis = askPrice + repairs + assignment;
    const closingCosts = arv * closingCostsPercent;
    const holdingCosts = arv * holdingCostsPercent;
    const totalInvested = askPrice + repairs + assignment + closingCosts + holdingCosts;

    const grossEquity = calculateGrossEquity(arv, totalCostBasis);
    const equityPercentage = calculateEquityPercentage(arv, askPrice);

    // 2. MAO (Maximum Allowable Offer) Calculation
    const standardMao = calculateMAO(arv, repairs, assignment, maoFactor);

    // 3. ROI Calculation
    const projectedProfit = arv - totalInvested;
    const roi = calculateROI(arv, totalInvested);

    // 4. Deal Score (Simple Heuristic)
    let score = calculateDealScore(equityPercentage, roi, deal.condition);

    // Risk Factors
    const riskFactors: string[] = [];
    if (!deal.arv) riskFactors.push("ARV is missing; using Asking Price as proxy.");

    const lowEquityThresh = settings.low_equity_threshold ?? DEFAULT_GOVERNANCE.LOW_EQUITY_THRESHOLD;
    if (equityPercentage < lowEquityThresh) riskFactors.push(`Low equity margin (<${lowEquityThresh.toFixed(1)}%).`);

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
