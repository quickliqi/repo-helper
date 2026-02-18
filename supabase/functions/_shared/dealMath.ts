/**
 * Shared Math Utility for Edge Functions
 * Mirror of src/lib/calculations.ts to ensure 0% deviation.
 */

export interface DealMetrics {
    grossEquity: number;
    equityPercentage: number;
    mao: number;
    projectedProfit: number;
    roi: number;
    score: number;
    riskFactors: string[];
}

// Constants for default assumptions if not provided
export const DEFAULT_GOVERNANCE = {
    CLOSING_COSTS_PERCENT: 0.03,
    HOLDING_COSTS_PERCENT: 0.02,
    MAO_DISCOUNT_RATE: 0.70, // Standard 70% rule
    TARGET_ROI_FLIP: 0.15,
    WHOLESALE_FEE_DEFAULT: 5000,
    LOW_EQUITY_THRESHOLD: 10,
    HIGH_ROI_WARNING_THRESHOLD: 200
};

/**
 * Strips non-numeric characters from a string, preserving decimal points.
 * Handles messy inputs like "$285k" -> 285000, "$1,200.50" -> 1200.50
 */
export function cleanNumber(input: string | number | undefined | null): number {
    if (input === undefined || input === null) return 0;
    if (typeof input === 'number') {
        return isNaN(input) ? 0 : input;
    }

    let str = String(input).trim();
    if (!str) return 0;

    // Handle "k" suffix for thousands (e.g. 285k -> 285000)
    const lower = str.toLowerCase();
    let multiplier = 1;
    if (lower.endsWith('k')) {
        multiplier = 1000;
        str = lower.slice(0, -1);
    } else if (lower.endsWith('m')) {
        multiplier = 1000000;
        str = lower.slice(0, -1);
    }

    // Remove all non-numeric chars except dot and minus
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val * multiplier;
}

/**
 * Calculates equity percentage strictly
 * Formula: ((ARV - (Price + Repairs + Assignment)) / ARV) * 100
 */
export function calculateEquityPercentage(
    arv: number,
    price: number,
    repairs: number = 0,
    assignment: number = 0
): number {
    if (!arv || arv === 0) return 0;
    const totalCostBasis = price + repairs + assignment;
    const grossEquity = arv - totalCostBasis;
    return (grossEquity / arv) * 100;
}

/**
 * Calculates Deal Score based on heuristic
 */
export function calculateDealScore(
    equityPercentage: number,
    roi: number,
    condition: string = 'fair'
): number {
    let score = 50; // Base score

    if (equityPercentage > 20) score += 20;
    if (equityPercentage > 30) score += 10;
    if (roi > 15) score += 10;
    if (roi > 30) score += 10;

    // Penalize poor condition if no repairs planned
    const cond = (condition || '').toLowerCase();
    if (cond === 'distressed' || cond === 'poor' || cond === 'tear') score -= 10;

    return Math.max(0, Math.min(100, score));
}

/**
 * Full Metrics Calculation
 */
export function calculateMetrics(
    arv: number,
    price: number,
    repairs: number = 0,
    assignment: number = 0,
    condition: string = 'fair'
): DealMetrics {
    const safeArv = cleanNumber(arv);
    const safePrice = cleanNumber(price);
    const safeRepairs = cleanNumber(repairs);
    const safeAssignment = cleanNumber(assignment);

    // 1. Equity
    const equityPercentage = calculateEquityPercentage(safeArv, safePrice, safeRepairs, safeAssignment);
    const totalCostBasis = safePrice + safeRepairs + safeAssignment;
    const grossEquity = safeArv - totalCostBasis;

    // 2. MAO
    // Formula: (ARV * 0.70) - Repairs - Assignment
    const mao = (safeArv * DEFAULT_GOVERNANCE.MAO_DISCOUNT_RATE) - safeRepairs - safeAssignment;

    // 3. ROI
    // Profit = ARV - (Purchase + Repairs + Assignment + Closing + Holding)
    const closingCosts = safeArv * DEFAULT_GOVERNANCE.CLOSING_COSTS_PERCENT;
    const holdingCosts = safeArv * DEFAULT_GOVERNANCE.HOLDING_COSTS_PERCENT;
    const totalInvested = safePrice + safeRepairs + safeAssignment + closingCosts + holdingCosts;
    const projectedProfit = safeArv - totalInvested;
    const roi = totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;

    // 4. Score
    const score = calculateDealScore(equityPercentage, roi, condition);

    // 5. Risk Factors
    const riskFactors: string[] = [];
    if (safeArv === 0) riskFactors.push("ARV is missing.");
    if (equityPercentage < DEFAULT_GOVERNANCE.LOW_EQUITY_THRESHOLD) riskFactors.push(`Low equity (<${DEFAULT_GOVERNANCE.LOW_EQUITY_THRESHOLD}%).`);
    if (roi < 0) riskFactors.push("Negative projected ROI.");

    return {
        grossEquity,
        equityPercentage,
        mao,
        projectedProfit,
        roi,
        score,
        riskFactors
    };
}
