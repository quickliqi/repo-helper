/**
 * Agent 4: Cross-Check & Analytics Agent
 * 
 * Validates scraped deal metrics against the Calculator Agent,
 * flags ±5% deviations, and detects data drift.
 */

import { ScrapedDeal, CrossCheckReport } from '../../types/scraper-audit-types';
import { calculateDealMetrics } from '../calculations';
import { DealInput } from '../../types/deal-types';

const DEVIATION_THRESHOLD = 5; // percent

interface HistoricalBaseline {
    avgPrice: number;
    avgArv: number;
    avgEquity: number;
    avgScore: number;
    sessionCount: number;
}

/**
 * Convert a ScrapedDeal to a DealInput for the Calculator Agent
 */
function toDealInput(deal: ScrapedDeal): DealInput {
    return {
        title: deal.title || 'Untitled Deal',
        address: deal.address || 'Unknown',
        city: deal.city || 'Unknown',
        state: deal.state || 'XX',
        zip_code: deal.zip_code || '00000',
        property_type: (deal.property_type as DealInput['property_type']) || 'single_family',
        deal_type: (deal.deal_type as DealInput['deal_type']) || 'wholesale',
        condition: (deal.condition as DealInput['condition']) || 'fair',
        asking_price: deal.asking_price || deal.price,
        arv: deal.arv,
        repair_estimate: deal.repair_estimate,
        bedrooms: deal.bedrooms,
        bathrooms: deal.bathrooms,
        sqft: deal.sqft,
    };
}

function percentDeviation(reported: number, calculated: number): number {
    if (calculated === 0) return reported === 0 ? 0 : 100;
    return Math.abs(((reported - calculated) / calculated) * 100);
}

export function runCrossCheck(
    deals: ScrapedDeal[],
    historicalBaseline?: HistoricalBaseline
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

        // --- DEAL AUTOPSY LOG ---
        console.log('--- DEAL AUTOPSY ---', {
            title: deal.title,
            rawPrice: deal.price,
            rawARV: deal.arv,
            rawRepairs: deal.repair_estimate,
            reportedEquity: deal.equity_percentage,
            frontendCalculatedEquity: metrics.equityPercentage,
            reportedScore: deal.ai_score,
            frontendCalculatedScore: metrics.score
        });

        // Cross-check reported equity against calculated equity
        if (deal.equity_percentage !== undefined) {
            const dev = percentDeviation(deal.equity_percentage, metrics.equityPercentage);
            if (dev > DEVIATION_THRESHOLD) {
                mismatches.push({
                    field: 'equity_percentage',
                    reportedValue: deal.equity_percentage,
                    calculatedValue: metrics.equityPercentage,
                    deviationPercent: Math.round(dev),
                });
            }
        }

        // Cross-check reported score against calculated score
        if (deal.ai_score !== undefined) {
            const dev = percentDeviation(deal.ai_score, metrics.score);
            if (dev > DEVIATION_THRESHOLD) {
                mismatches.push({
                    field: 'ai_score',
                    reportedValue: deal.ai_score,
                    calculatedValue: metrics.score,
                    deviationPercent: Math.round(dev),
                });
            }
        }

        // Check MAO plausibility
        if ((deal.asking_price || deal.price) && metrics.mao > 0) {
            const price = deal.asking_price || deal.price || 0;
            if (price > metrics.mao * 1.3) {
                driftFlags.push(
                    `Asking price ($${price.toLocaleString()}) is ${Math.round(((price / metrics.mao) - 1) * 100)}% above MAO ($${Math.round(metrics.mao).toLocaleString()}) — may not be a viable deal`
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

    // Data drift detection against historical baseline
    if (historicalBaseline && historicalBaseline.sessionCount > 0) {
        const currentAvgPrice = deals.reduce((sum, d) => sum + (d.asking_price || d.price || 0), 0) / deals.length;
        const priceDeviation = percentDeviation(currentAvgPrice, historicalBaseline.avgPrice);
        if (priceDeviation > 20) {
            recommendations.push(
                `Average price shifted ${priceDeviation.toFixed(0)}% from historical baseline — possible market shift or scraping anomaly`
            );
        }

        const currentAvgArv = deals.filter(d => d.arv).reduce((sum, d) => sum + (d.arv || 0), 0) /
            Math.max(1, deals.filter(d => d.arv).length);
        if (currentAvgArv > 0) {
            const arvDeviation = percentDeviation(currentAvgArv, historicalBaseline.avgArv);
            if (arvDeviation > 20) {
                recommendations.push(
                    `Average ARV shifted ${arvDeviation.toFixed(0)}% from historical baseline`
                );
            }
        }
    }

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
