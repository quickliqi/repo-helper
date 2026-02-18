
/**
 * Calculation Integrity Agent
 * Central source of truth for all financial math in the application.
 */

import { LoggingService } from './logging-service';
import { DealInput, DealMetrics, GovernanceResult } from '../types/deal-types';
import {
    sanitizeNumber,
    calculateEquityPercentage,
    calculateMAO,
    calculateROI,
    calculateDealScore,
    calculateGrossEquity
} from '../utils/dealMath';

// Constants for default assumptions if not provided in settings
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
    max_allowable_offer_factor?: number; // e.g. 0.70
    high_roi_threshold?: number;
    low_equity_threshold?: number;
}

/**
 * Calculates all key metrics for a deal.
 * Returns null if critical data (like asking price) is missing.
 */
export function calculateDealMetrics(
    deal: DealInput,
    settings: GovernanceSettings = {}
): DealMetrics | null {
    // Sanitize inputs first using valid "Number Guard"
    const askPrice = sanitizeNumber(deal.asking_price);
    if (askPrice <= 0) return null; // Critical: cannot calculate without price

    const arv = sanitizeNumber(deal.arv || askPrice); // Fallback to asking if ARV not set
    const repairs = sanitizeNumber(deal.repair_estimate);
    const assignment = sanitizeNumber(deal.assignment_fee);

    // Apply Governance Settings or Defaults
    const closingCostsPercent = settings.default_closing_costs ?? DEFAULT_GOVERNANCE.CLOSING_COSTS_PERCENT;
    const holdingCostsPercent = settings.default_holding_costs ?? DEFAULT_GOVERNANCE.HOLDING_COSTS_PERCENT;
    const maoFactor = settings.max_allowable_offer_factor ?? DEFAULT_GOVERNANCE.MAO_DISCOUNT_RATE;

    // 1. Equity Calculations
    // Note: We use total cost basis for Gross Equity to be realistic, 
    // but specific equityPercentage logic follows the requested unified formula 
    // if implemented strictly in dealMath. Logic here uses dealMath.

    // Total Cost for ROI purposes
    const closingCosts = arv * closingCostsPercent;
    const holdingCosts = arv * holdingCostsPercent;
    const totalInvested = askPrice + repairs + assignment + closingCosts + holdingCosts;
    const totalCostBasis = askPrice + repairs + assignment;

    const grossEquity = calculateGrossEquity(arv, totalCostBasis);

    // STRICT REQUEST: equity_percentage = ((ARV - ListPrice) / ARV) * 100
    // dealMath.calculateEquityPercentage implements this exact logic.
    const equityPercentage = calculateEquityPercentage(arv, askPrice);

    // 2. MAO (Maximum Allowable Offer) Calculation
    const standardMao = calculateMAO(arv, repairs, assignment, maoFactor);

    // 3. ROI Calculation (Flip Scenario)
    const projectedProfit = arv - totalInvested;
    const roi = calculateROI(arv, totalInvested);

    // 4. Cash on Cash (Rental Scenario - placeholder logic)
    const cashOnCashCount = null;

    // 5. Deal Score
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
        cashOnCashCount,
        breakEvenTimelineMonths: undefined,
        score,
        riskFactors
    };
}

/**
 * Validates the deal specifically for Governance purposes.
 * This runs after general Zod validation to check *financial* logic.
 */
export function auditDeal(deal: DealInput, settings: GovernanceSettings = {}): GovernanceResult {
    const metrics = calculateDealMetrics(deal, settings);
    const flags: GovernanceResult['flags'] = [];
    const validationErrors: string[] = [];

    if (!metrics) {
        return {
            isValid: false,
            validationErrors: ["Unable to calculate metrics due to missing Financial data."],
            metrics: null,
            confidenceScore: 0,
            flags: [{ level: 'critical', message: "Calculation failed completely." }]
        };
    }

    // Drift / Sanity Checks
    if (deal.sqft && deal.asking_price) {
        const ppsf = deal.asking_price / deal.sqft;
        if (ppsf < 10 || ppsf > 2000) {
            flags.push({ level: 'warning', message: `Price per sqft($${ppsf.toFixed(0)}) seems anomalous.` });
        }
    }

    const highRoiThresh = settings.high_roi_threshold ?? DEFAULT_GOVERNANCE.HIGH_ROI_WARNING_THRESHOLD;
    if (metrics.roi > highRoiThresh) {
        flags.push({ level: 'warning', message: `Projected ROI > ${highRoiThresh}%. Verify input data.` });
    }

    if (metrics.equityPercentage < 0) {
        flags.push({ level: 'critical', message: "Negative Equity deal." });
    }

    // Confidence Score Calculation
    let confidence = 100;
    if (!deal.arv) confidence -= 30; // Huge penalty for missing ARV
    if (!deal.repair_estimate) confidence -= 20;
    if (!deal.sqft) confidence -= 10;
    if (flags.some(f => f.level === 'warning')) confidence -= 10;
    if (flags.some(f => f.level === 'critical')) confidence -= 30;

    return {
        isValid: flags.filter(f => f.level === 'critical').length === 0,
        validationErrors,
        metrics,
        confidenceScore: Math.max(0, confidence),
        flags
    };
}

/**
 * Orchestrator function: audits the deal and logs the result.
 * Use this in your UI/API handlers.
 */
export async function processAndLogDeal(
    deal: DealInput,
    user_id?: string,
    settings?: GovernanceSettings
): Promise<GovernanceResult> {
    const result = auditDeal(deal, settings);

    // Log asynchronously (fire and forget)
    LoggingService.logCalculationEvent(deal.id, deal, result, user_id).catch(console.error);

    return result;
}
