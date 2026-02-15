
/**
 * Agent 4: Cross-Check & Analytics Agent
 *
 * Validates scraped deal metrics against the Calculator Agent,
 * flags ±5% deviations, and detects data drift.
 */

import { ScrapedDeal, CrossCheckReport } from "../types.ts";
import { calculateDealMetrics, DealInput } from "../calculations.ts";

const DEVIATION_THRESHOLD = 5; // percent

/**
 * Convert a ScrapedDeal to a DealInput for the Calculator Agent
 */
function toDealInput(deal: ScrapedDeal): DealInput {
    return {
        // title: deal.title,
        condition: deal.condition,
        asking_price: deal.asking_price || deal.price,
        arv: deal.arv,
        repair_estimate: deal.repair_estimate,
        sqft: deal.sqft,
    };
}

function percentDeviation(reported: number, calculated: number): number {
    if (calculated === 0) return reported === 0 ? 0 : 100;
    return Math.abs(((reported - calculated) / calculated) * 100);
}

export function runCrossCheck(
    deals: ScrapedDeal[]
): CrossCheckReport {
    const recommendations: string[] = [];

    const perDeal = deals.map((deal, index) => {
        const input = toDealInput(deal);
        const metrics = calculateDealMetrics(input);
        const mismatches: CrossCheckReport['perDeal'][0]['mismatches'] = [];
        const driftFlags: string[] = [];

        if (!metrics) {
            return {
                dealIndex: index,
                title: deal.title || `Deal #${index + 1}`,
                mismatches: [],
                driftFlags: ['Could not calculate metrics — insufficient data'],
            };
        }

        // Compare ai_score (AI-reported quality) vs calculated deal score
        if (deal.ai_score !== undefined) {
            const deviation = percentDeviation(deal.ai_score, metrics.score);
            if (deviation > DEVIATION_THRESHOLD) {
                mismatches.push({
                    field: 'deal_score',
                    reportedValue: deal.ai_score,
                    calculatedValue: metrics.score,
                    deviationPercent: Math.round(deviation * 10) / 10,
                });
            }
        }

        // Compare equity percentage if reported
        if (deal.equity_percentage !== undefined) {
            const deviation = percentDeviation(deal.equity_percentage, metrics.equityPercentage);
            if (deviation > DEVIATION_THRESHOLD) {
                mismatches.push({
                    field: 'equity_percentage',
                    reportedValue: deal.equity_percentage,
                    calculatedValue: Math.round(metrics.equityPercentage * 10) / 10,
                    deviationPercent: Math.round(deviation * 10) / 10,
                });
            }
        }

        // Check MAO plausibility
        if (deal.asking_price && metrics.mao > 0) {
            if (deal.asking_price > metrics.mao * 1.3) {
                driftFlags.push(
                    `Asking price ($${deal.asking_price.toLocaleString()}) is ${Math.round(((deal.asking_price / metrics.mao) - 1) * 100)}% above MAO ($${Math.round(metrics.mao).toLocaleString()}) — may not be a viable deal`
                );
            }
        }

        // Check for negative ROI
        if (metrics.roi < 0) {
            driftFlags.push(`Negative ROI (${metrics.roi.toFixed(1)}%) — deal may lose money`);
        }

        return {
            dealIndex: index,
            title: deal.title || `Deal #${index + 1}`,
            mismatches,
            driftFlags,
        };
    });

    const mismatchCount = perDeal.reduce((sum, d) => sum + d.mismatches.length, 0);
    if (mismatchCount > deals.length * 0.5) {
        recommendations.push(
            'More than 50% of deals have calculation mismatches — review AI scoring logic or data source quality'
        );
    }

    return {
        totalDeals: deals.length,
        mismatchCount,
        perDeal,
        recommendations,
    };
}
