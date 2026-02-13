/**
 * Agent 2: Relevance & Context Agent
 * 
 * Compares scraped deals against investor buy box criteria
 * to determine platform relevance and investor alignment.
 */

import { ScrapedDeal, RelevanceReport } from '../../types/scraper-audit-types';

interface BuyBoxCriteria {
    id: string;
    name: string;
    property_types: string[];
    deal_types: string[];
    min_price: number | null;
    max_price: number | null;
    min_arv: number | null;
    max_arv: number | null;
    min_equity_percentage: number | null;
    target_cities: string[];
    target_states: string[];
    target_zip_codes: string[];
    preferred_conditions: string[];
}

const IRRELEVANT_THRESHOLD = 30;

function scoreDealAgainstBuyBox(deal: ScrapedDeal, bb: BuyBoxCriteria): { score: number; reasons: string[] } {
    let score = 100;
    const reasons: string[] = [];
    const price = deal.asking_price || deal.price;

    // Critical mismatches (deal breakers)
    if (bb.property_types.length > 0 && deal.property_type && !bb.property_types.includes(deal.property_type)) {
        score = 0;
        reasons.push(`Property type '${deal.property_type}' not in buy box`);
    }

    if (bb.deal_types.length > 0 && deal.deal_type && !bb.deal_types.includes(deal.deal_type)) {
        score = 0;
        reasons.push(`Deal type '${deal.deal_type}' not in buy box`);
    }

    if (bb.target_states.length > 0 && deal.state && !bb.target_states.includes(deal.state)) {
        score = 0;
        reasons.push(`State '${deal.state}' outside target market`);
    }

    if (score === 0) return { score, reasons };

    // Financial criteria
    if (bb.min_price && price < bb.min_price) {
        score -= 20;
        reasons.push(`Below min price ($${bb.min_price.toLocaleString()})`);
    }

    if (bb.max_price && price > bb.max_price) {
        score -= 20;
        reasons.push(`Above max price ($${bb.max_price.toLocaleString()})`);
    }

    if (bb.min_arv && deal.arv && deal.arv < bb.min_arv) {
        score -= 15;
        reasons.push(`ARV below target ($${bb.min_arv.toLocaleString()})`);
    }

    if (bb.max_arv && deal.arv && deal.arv > bb.max_arv) {
        score -= 10;
        reasons.push(`ARV above maximum ($${bb.max_arv.toLocaleString()})`);
    }

    if (bb.min_equity_percentage && deal.equity_percentage !== undefined && deal.equity_percentage < bb.min_equity_percentage) {
        score -= 25;
        reasons.push(`Equity ${deal.equity_percentage}% below target ${bb.min_equity_percentage}%`);
    }

    // Location bonuses
    if (bb.target_cities.length > 0 && deal.city) {
        const cityMatch = bb.target_cities.some(c =>
            c.toLowerCase() === deal.city!.toLowerCase()
        );
        if (cityMatch) {
            score += 10;
            reasons.push('In target city');
        }
    }

    if (bb.target_zip_codes.length > 0 && deal.zip_code) {
        if (bb.target_zip_codes.includes(deal.zip_code)) {
            score += 5;
            reasons.push('In target zip code');
        }
    }

    // Condition match
    if (bb.preferred_conditions.length > 0 && deal.condition) {
        if (bb.preferred_conditions.includes(deal.condition)) {
            score += 5;
            reasons.push('Matches preferred condition');
        }
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function runRelevanceCheck(
    deals: ScrapedDeal[],
    buyBoxes: BuyBoxCriteria[]
): RelevanceReport {
    if (buyBoxes.length === 0) {
        return {
            totalDeals: deals.length,
            relevantCount: deals.length,
            irrelevantCount: 0,
            perDeal: deals.map((deal, i) => ({
                dealIndex: i,
                title: deal.title || `Deal #${i + 1}`,
                fitScore: 50,
                isRelevant: true,
                reasons: ['No buy box configured — all deals considered relevant'],
            })),
            alignmentSummary: 'No buy boxes configured. All deals treated as potentially relevant.',
        };
    }

    const perDeal = deals.map((deal, i) => {
        let bestScore = 0;
        let bestReasons: string[] = [];
        let bestBuyBoxId: string | undefined;

        for (const bb of buyBoxes) {
            const { score, reasons } = scoreDealAgainstBuyBox(deal, bb);
            if (score > bestScore) {
                bestScore = score;
                bestReasons = reasons;
                bestBuyBoxId = bb.id;
            }
        }

        return {
            dealIndex: i,
            title: deal.title || `Deal #${i + 1}`,
            fitScore: bestScore,
            isRelevant: bestScore >= IRRELEVANT_THRESHOLD,
            matchedBuyBoxId: bestBuyBoxId,
            reasons: bestReasons,
        };
    });

    const relevantCount = perDeal.filter(d => d.isRelevant).length;
    const irrelevantCount = perDeal.length - relevantCount;

    const alignmentSummary = relevantCount === deals.length
        ? `All ${deals.length} deals align with investor criteria.`
        : `${relevantCount} of ${deals.length} deals match buy box criteria. ${irrelevantCount} flagged as irrelevant (fit score < ${IRRELEVANT_THRESHOLD}).`;

    return {
        totalDeals: deals.length,
        relevantCount,
        irrelevantCount,
        perDeal,
        alignmentSummary,
    };
}
