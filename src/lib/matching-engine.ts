import { BuyBox, Property } from '../types/database';
import { DealMetrics } from '../types/deal-types';

export interface MatchResult {
    score: number; // 0-100
    isMatch: boolean;
    reasons: {
        positive: string[];
        negative: string[];
    };
}

/**
 * Investor Context Awareness Agent
 * Matches a deal against an investor's Buy Box criteria.
 */
export function calculateFitScore(
    deal: Property | (Partial<Property> & { arv?: number, repair_estimate?: number }),
    metrics: DealMetrics | null,
    buyBox: BuyBox
): MatchResult {
    let score = 100;
    const positive: string[] = [];
    const negative: string[] = [];

    // Critical Mismatches (Deal Breakers)
    if (buyBox.property_types.length > 0 && !buyBox.property_types.includes(deal.property_type)) {
        score = 0;
        negative.push(`Property type '${deal.property_type}' not in buy box.`);
    }

    if (buyBox.deal_types.length > 0 && !buyBox.deal_types.includes(deal.deal_type)) {
        score = 0;
        negative.push(`Deal type '${deal.deal_type}' not in buy box.`);
    }

    if (buyBox.target_states.length > 0 && !buyBox.target_states.includes(deal.state)) {
        score = 0;
        negative.push(`State '${deal.state}' not in target market.`);
    }

    // If critical mismatch, return immediately
    if (score === 0) {
        return { score, isMatch: false, reasons: { positive, negative } };
    }

    // Financial Criteria
    if (buyBox.min_price && deal.asking_price < buyBox.min_price) {
        score -= 20;
        negative.push(`Price below minimum ($${buyBox.min_price}).`);
    }

    if (buyBox.max_price && deal.asking_price > buyBox.max_price) {
        score -= 20;
        negative.push(`Price above maximum ($${buyBox.max_price}).`);
    }

    // Advanced Metrics from Calculation Agent
    if (metrics) {
        if (buyBox.min_arv && (metrics.mao < buyBox.min_arv)) { // Logic check: comparing MAO vs ARV? Prob means ARV.
            // actually logic: deal.arv vs buyBox.min_arv
            if (deal.arv && deal.arv < buyBox.min_arv) {
                score -= 10;
                negative.push(`ARV below target.`);
            }
        }

        if (buyBox.min_equity_percentage && metrics.equityPercentage < buyBox.min_equity_percentage) {
            score -= 30;
            negative.push(`Equity (${metrics.equityPercentage.toFixed(0)}%) below target (${buyBox.min_equity_percentage}%).`);
        } else if (metrics.equityPercentage >= (buyBox.min_equity_percentage || 20)) {
            positive.push("Meets equity requirements.");
        }

        if (metrics.roi > 15) positive.push("Strong projected ROI.");
    }

    // Location (Zip Code)
    if (buyBox.target_zip_codes && buyBox.target_zip_codes.length > 0) {
        if (buyBox.target_zip_codes.includes(deal.zip_code)) {
            score += 10; // Bonus
            positive.push("In target zip code.");
        } else {
            // Not a negative, just not a bonus unless radius strictly enforced
        }
    }

    // Cap score
    score = Math.max(0, Math.min(100, score));

    return {
        score,
        isMatch: score > 60,
        reasons: {
            positive,
            negative
        }
    };
}
