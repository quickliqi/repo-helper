
/**
 * Unified Deal Mathematics Utility
 * Single Source of Truth for all financial calculations in the application.
 * Used by both Frontend and Backend (Edge Functions).
 */

/**
 * Sanitizes input to ensure it is a valid number.
 * Strips currency symbols ($, ,) and handles strings.
 * Returns 0 if input is invalid/null/undefined.
 */
export function sanitizeNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }
    // Handle string inputs
    const cleanStr = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

/**
 * Calculates Gross Equity and Equity Percentage.
 * Equity % = ((ARV - Total Cost Basis) / ARV) * 100
 * Note: Total Cost Basis usually includes purchase price + repairs + assignment.
 * If strictly following user request: ((ARV - ListPrice) / ARV) * 100
 * However, standard real estate math typically subtracts repairs to find true equity.
 * verified with user request: "Formula: equity_percentage = ((ARV - ListPrice) / ARV) * 100"
 * I will implement the requested formula but allow for "Total Cost" if needed, 
 * strictly adhering to the prompt for checks.
 */
export function calculateEquityPercentage(arv: number, purchasePrice: number): number {
    const safeArv = sanitizeNumber(arv);
    const safePrice = sanitizeNumber(purchasePrice);

    if (safeArv === 0) return 0;

    // User requested formula: ((ARV - ListPrice) / ARV) * 100
    // We assume 'ListPrice' here is the Purchase Price / Asking Price
    return ((safeArv - safePrice) / safeArv) * 100;
}

export function calculateGrossEquity(arv: number, totalCostBasis: number): number {
    return sanitizeNumber(arv) - sanitizeNumber(totalCostBasis);
}

/**
 * Calculates Maximum Allowable Offer (MAO).
 * Formula: (ARV * DiscountFactor) - Repairs - AssignmentFee
 */
export function calculateMAO(
    arv: number,
    repairs: number,
    assignment: number,
    discountFactor: number = 0.70
): number {
    const safeArv = sanitizeNumber(arv);
    const safeRepairs = sanitizeNumber(repairs);
    const safeAssignment = sanitizeNumber(assignment);

    return (safeArv * discountFactor) - safeRepairs - safeAssignment;
}

/**
 * Calculates ROI (Return on Investment) for a Flip.
 * Profit = ARV - Total Investment
 * ROI = (Profit / Total Investment) * 100
 * Total Investment = Purchase + Repairs + Assignment + Holding + Closing
 */
export function calculateROI(
    arv: number,
    totalInvestment: number
): number {
    const safeArv = sanitizeNumber(arv);
    const safeInvestment = sanitizeNumber(totalInvestment);

    if (safeInvestment === 0) return 0;

    const profit = safeArv - safeInvestment;
    return (profit / safeInvestment) * 100;
}

/**
 * Calculates Deal Score based on Equity and ROI.
 * Simple heuristic 0-100.
 */
export function calculateDealScore(
    equityPercent: number,
    roi: number,
    condition: string = ''
): number {
    let score = 50; // Base score

    // Equity Bonuses
    if (equityPercent > 20) score += 20;
    else if (equityPercent > 10) score += 10;

    // ROI Bonuses
    if (roi > 15) score += 10;
    if (roi > 30) score += 10; // Stackable if very high

    // Condition Penalties
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('distressed') || lowerCondition.includes('poor') || lowerCondition.includes('tear')) {
        score -= 10;
    }

    // Normalize 0-100
    return Math.max(0, Math.min(100, score));
}
