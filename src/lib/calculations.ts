
/**
 * Calculation Integrity Agent
 * Central source of truth for all financial math in the application.
 */

import { LoggingService } from './logging-service';
import { DealInput, DealMetrics, GovernanceResult } from '../types/deal-types';

// Constants for default assumptions if not provided
const DEFAULT_CLOSING_COSTS_PERCENT = 0.03; // 3% closing costs
const DEFAULT_HOLDING_COSTS_PERCENT = 0.02; // 2% holding costs
const DEFAULT_DESIRED_ROI = 0.15; // 15% target ROI for MAO calc
const WHOLESALE_FEE_DEFAULT = 5000;

/**
 * Calculates all key metrics for a deal.
 * Returns null if critical data (like asking price) is missing.
 */
export function calculateDealMetrics(deal: DealInput): DealMetrics | null {
    if (!deal.asking_price) return null;

    const arv = deal.arv || deal.asking_price; // Fallback to asking if ARV not set (risky, flagged later)
    const repairs = deal.repair_estimate || 0;
    const assignment = deal.assignment_fee || 0;

    // 1. Equity Calculations
    const totalCostBasis = deal.asking_price + repairs + assignment;
    const grossEquity = arv - totalCostBasis;
    const equityPercentage = arv > 0 ? (grossEquity / arv) * 100 : 0;

    // 2. MAO (Maximum Allowable Offer) Calculation
    // Standard Formula: (ARV * 0.70) - Repairs - Assignment
    // Advanced Formula: (ARV * (1 - DesiredROI - ClosingCosts)) - Repairs - Assignment
    const standardMao = (arv * 0.70) - repairs - assignment;

    // 3. ROI Calculation (Flip Scenario)
    // Profit = ARV - (Purchase + Repairs + Assignment + Closing/Holding)
    // ROI = Profit / Total Invested
    const closingCosts = arv * DEFAULT_CLOSING_COSTS_PERCENT;
    const holdingCosts = arv * DEFAULT_HOLDING_COSTS_PERCENT; // Simplified
    const totalInvested = deal.asking_price + repairs + assignment + closingCosts + holdingCosts;
    const projectedProfit = arv - totalInvested;
    const roi = totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;

    // 4. Cash on Cash (Rental Scenario - placeholder logic)
    // Needs Rent, OpEx, etc. For now, return null unless we have rent data (not in current Property type)
    const cashOnCashCount = null;

    // 5. Deal Score (Simple Heuristic for now)
    // Based on Equity % and ROI
    let score = 50; // Base
    if (equityPercentage > 20) score += 20;
    if (equityPercentage > 30) score += 10;
    if (roi > 15) score += 10;
    if (roi > 30) score += 10;
    if (deal.condition === 'distressed' || deal.condition === 'poor') score -= 10; // High risk

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Risk Factors
    const riskFactors: string[] = [];
    if (!deal.arv) riskFactors.push("ARV is missing; using Asking Price as proxy.");
    if (equityPercentage < 10) riskFactors.push("Low equity margin (<10%).");
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
export function auditDeal(deal: DealInput): GovernanceResult {
    const metrics = calculateDealMetrics(deal);
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

    if (metrics.roi > 200) {
        flags.push({ level: 'warning', message: "Projected ROI > 200%. Verify input data." });
    }

    if (metrics.equityPercentage < 0) {
        flags.push({ level: 'critical', message: "Negative Equity deal." });
    }

    // Confidence Score Calculation
    // Starts at 100, penalized by missing data or warnings
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
    user_id?: string
): Promise<GovernanceResult> {
    const result = auditDeal(deal);

    // Log asynchronously (fire and forget)
    LoggingService.logCalculationEvent(deal.id, deal, result, user_id).catch(console.error);

    return result;
}
