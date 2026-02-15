
/**
 * Agent 2: Relevance & Context Agent (v2)
 *
 * Enhanced relevance scoring:
 * - Entity-weighted keyword matching
 * - Domain whitelist/blacklist enforcement
 * - Thin content rejection
 * - Configurable thresholds via scraper_config
 */

import { ScrapedDeal, RelevanceReport, RelevanceConfig, BuyBoxForAudit } from "../types.ts";

const ENTITY_WEIGHTS: Record<string, number> = {
    location: 2.0,
    deal_type: 3.0,
    property_type: 2.5,
    condition: 1.5,
    price_range: 2.0,
    financial: 1.8,
};

const RELEVANCE_KEYWORDS: Record<string, { keywords: string[]; weight: number }> = {
    high_value: {
        keywords: ['motivated seller', 'below market', 'must sell', 'price reduced', 'distressed', 'foreclosure', 'short sale', 'as-is'],
        weight: 15,
    },
    investment: {
        keywords: ['investment', 'investor', 'cash flow', 'rental income', 'cap rate', 'roi', 'fixer', 'rehab'],
        weight: 10,
    },
    negative: {
        keywords: ['scam', 'timeshare', 'vacation', 'fractional', 'nft', 'crypto'],
        weight: -30,
    },
};

const CRITICAL_FIELDS: (keyof ScrapedDeal)[] = [
    'title', 'price', 'location', 'source', 'address', 'city', 'state',
];

/**
 * Fetch relevance config from scraper_config table (via wrapper)
 */
export async function fetchRelevanceConfig(supabaseClient: any): Promise<RelevanceConfig> {
    const defaults: RelevanceConfig = {
        relevanceThreshold: 30,
        minDescriptionLength: 20,
        minRequiredFields: 4,
    };
    try {
        const { data } = await supabaseClient
            .from('scraper_config')
            .select('key, value')
            .in('key', ['relevance_threshold', 'min_description_length', 'min_required_fields']);

        if (data) {
            for (const row of data) {
                if (row.key === 'relevance_threshold') defaults.relevanceThreshold = Number(row.value);
                if (row.key === 'min_description_length') defaults.minDescriptionLength = Number(row.value);
                if (row.key === 'min_required_fields') defaults.minRequiredFields = Number(row.value);
            }
        }
    } catch {
        console.warn('[RELEVANCE] Failed to fetch config, using defaults');
    }
    return defaults;
}

/**
 * Check deal source URL against domain whitelist/blacklist.
 */
async function checkDomainRules(deals: ScrapedDeal[], supabaseClient: any): Promise<Map<number, string>> {
    const rejections = new Map<number, string>();
    try {
        const { data } = await supabaseClient
            .from('scraper_domain_rules')
            .select('domain, rule_type');

        if (!data || data.length === 0) return rejections;

        const whitelist = data.filter((r: { rule_type: string }) => r.rule_type === 'whitelist').map((r: { domain: string }) => r.domain.toLowerCase());
        const blacklist = data.filter((r: { rule_type: string }) => r.rule_type === 'blacklist').map((r: { domain: string }) => r.domain.toLowerCase());

        deals.forEach((deal, index) => {
            const link = (deal.link || '').toLowerCase();
            const source = (deal.source || '').toLowerCase();

            // Check blacklist
            for (const domain of blacklist) {
                if (link.includes(domain) || source.includes(domain)) {
                    rejections.set(index, `Source domain "${domain}" is blacklisted`);
                    return;
                }
            }
            // Check whitelist if it exists and we have a valid link
            if (whitelist.length > 0 && link.startsWith('http')) {
                const isWhitelisted = whitelist.some((d: string) => link.includes(d));
                if (!isWhitelisted) {
                    rejections.set(index, `Source not in domain whitelist`);
                }
            }
        });
    } catch {
        console.warn('[RELEVANCE] Domain rule check failed, skipping');
    }
    return rejections;
}

function checkThinContent(
    deal: ScrapedDeal,
    config: RelevanceConfig
): string | null {
    // Check description length
    const desc = (deal.description || '').trim();
    if (desc.length > 0 && desc.length < config.minDescriptionLength) {
        return `Description too thin (${desc.length} chars, min: ${config.minDescriptionLength})`;
    }

    // Check missing critical fields
    let missingCount = 0;
    for (const field of CRITICAL_FIELDS) {
        const val = deal[field];
        if (val === undefined || val === null || val === '') {
            missingCount++;
        }
    }
    if (missingCount > config.minRequiredFields) {
        return `Too many missing critical fields (${missingCount} missing, max allowed: ${config.minRequiredFields})`;
    }

    return null;
}

function keywordScore(deal: ScrapedDeal): { bonus: number; reasons: string[] } {
    let bonus = 0;
    const reasons: string[] = [];
    const text = `${deal.title || ''} ${deal.description || ''}`.toLowerCase();

    for (const [category, config] of Object.entries(RELEVANCE_KEYWORDS)) {
        for (const keyword of config.keywords) {
            if (text.includes(keyword)) {
                bonus += config.weight;
                if (config.weight > 0) {
                    reasons.push(`Keyword match: "${keyword}" (+${config.weight})`);
                } else {
                    reasons.push(`Negative keyword: "${keyword}" (${config.weight})`);
                }
                break;
            }
        }
    }
    return { bonus, reasons };
}

function scoreDealAgainstBuyBox(deal: ScrapedDeal, bb: BuyBoxForAudit): { score: number; reasons: string[] } {
    let score = 100;
    const reasons: string[] = [];
    const price = deal.asking_price || deal.price;

    // Critical mismatches (deal breakers) — weighted
    if (bb.property_types.length > 0 && deal.property_type && !bb.property_types.includes(deal.property_type)) {
        score -= Math.round(40 * ENTITY_WEIGHTS.property_type);
        reasons.push(`Property type '${deal.property_type}' not in buy box`);
    }

    if (bb.deal_types.length > 0 && deal.deal_type && !bb.deal_types.includes(deal.deal_type)) {
        score -= Math.round(30 * ENTITY_WEIGHTS.deal_type);
        reasons.push(`Deal type '${deal.deal_type}' not in buy box`);
    }

    if (bb.target_states.length > 0 && deal.state && !bb.target_states.includes(deal.state)) {
        score -= Math.round(40 * ENTITY_WEIGHTS.location);
        reasons.push(`State '${deal.state}' outside target market`);
    }

    if (score <= 0) return { score: 0, reasons };

    // Financial criteria — weighted
    if (bb.min_price && price < bb.min_price) {
        score -= Math.round(10 * ENTITY_WEIGHTS.price_range);
        reasons.push(`Below min price ($${bb.min_price.toLocaleString()})`);
    }

    if (bb.max_price && price > bb.max_price) {
        score -= Math.round(10 * ENTITY_WEIGHTS.price_range);
        reasons.push(`Above max price ($${bb.max_price.toLocaleString()})`);
    }

    if (bb.min_arv && deal.arv && deal.arv < bb.min_arv) {
        score -= Math.round(8 * ENTITY_WEIGHTS.financial);
        reasons.push(`ARV below target ($${bb.min_arv.toLocaleString()})`);
    }

    if (bb.max_arv && deal.arv && deal.arv > bb.max_arv) {
        score -= Math.round(5 * ENTITY_WEIGHTS.financial);
        reasons.push(`ARV above maximum ($${bb.max_arv.toLocaleString()})`);
    }

    if (bb.min_equity_percentage && deal.equity_percentage !== undefined && deal.equity_percentage < bb.min_equity_percentage) {
        score -= Math.round(12 * ENTITY_WEIGHTS.financial);
        reasons.push(`Equity ${deal.equity_percentage}% below target ${bb.min_equity_percentage}%`);
    }

    // Location bonuses
    if (bb.target_cities.length > 0 && deal.city) {
        const cityMatch = bb.target_cities.some(c =>
            c.toLowerCase() === deal.city!.toLowerCase()
        );
        if (cityMatch) {
            score += Math.round(5 * ENTITY_WEIGHTS.location);
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
            score += Math.round(3 * ENTITY_WEIGHTS.condition);
            reasons.push('Matches preferred condition');
        }
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

export async function runRelevanceCheck(
    deals: ScrapedDeal[],
    buyBoxes: BuyBoxForAudit[],
    supabaseClient: any
): Promise<RelevanceReport> {
    const config = await fetchRelevanceConfig(supabaseClient);
    const domainRejections = await checkDomainRules(deals, supabaseClient);

    if (buyBoxes.length === 0 && domainRejections.size === 0) {
        // Fallback: keyword scoring + thin content check
        const perDeal = deals.map((deal, i) => {
            const thinReason = checkThinContent(deal, config);
            if (thinReason) {
                return {
                    dealIndex: i,
                    title: deal.title || `Deal #${i + 1}`,
                    fitScore: 0,
                    isRelevant: false,
                    reasons: [thinReason],
                };
            }

            const { bonus, reasons } = keywordScore(deal);
            const fitScore = Math.max(0, Math.min(100, 50 + bonus));

            return {
                dealIndex: i,
                title: deal.title || `Deal #${i + 1}`,
                fitScore,
                isRelevant: fitScore >= config.relevanceThreshold,
                reasons: reasons.length > 0 ? reasons : ['No buy box configured — scored by keyword relevance'],
            };
        });

        const relevantCount = perDeal.filter(d => d.isRelevant).length;
        return {
            totalDeals: deals.length,
            relevantCount,
            irrelevantCount: deals.length - relevantCount,
            perDeal,
            alignmentSummary: `No buy boxes configured. ${relevantCount} of ${deals.length} deals pass keyword relevance.`,
        };
    }

    const perDeal = deals.map((deal, i) => {
        // 1. Domain
        if (domainRejections.has(i)) {
            return {
                dealIndex: i,
                title: deal.title || `Deal #${i + 1}`,
                fitScore: 0,
                isRelevant: false,
                reasons: [domainRejections.get(i)!],
            };
        }

        // 2. Thin content
        const thinReason = checkThinContent(deal, config);
        if (thinReason) {
            return {
                dealIndex: i,
                title: deal.title || `Deal #${i + 1}`,
                fitScore: 0,
                isRelevant: false,
                reasons: [thinReason],
            };
        }

        // 3. Buy boxes
        let bestScore = 0;
        let bestReasons: string[] = [];
        let bestBuyBoxId: string | undefined;

        if (buyBoxes.length > 0) {
            for (const bb of buyBoxes) {
                const { score, reasons } = scoreDealAgainstBuyBox(deal, bb);
                if (score > bestScore) {
                    bestScore = score;
                    bestReasons = reasons;
                    bestBuyBoxId = bb.id;
                }
            }
        } else {
            bestScore = 50;
            bestReasons = ['No buy box — base score'];
        }

        // 4. Keyword bonus
        const { bonus, reasons: kwReasons } = keywordScore(deal);
        bestScore = Math.max(0, Math.min(100, bestScore + bonus));
        bestReasons = [...bestReasons, ...kwReasons];

        return {
            dealIndex: i,
            title: deal.title || `Deal #${i + 1}`,
            fitScore: bestScore,
            isRelevant: bestScore >= config.relevanceThreshold,
            matchedBuyBoxId: bestBuyBoxId,
            reasons: bestReasons,
        };
    });

    const relevantCount = perDeal.filter(d => d.isRelevant).length;
    const irrelevantCount = perDeal.length - relevantCount;
    const alignmentSummary = `${relevantCount} of ${deals.length} deals pass relevance (threshold: ${config.relevanceThreshold}).`;

    return {
        totalDeals: deals.length,
        relevantCount,
        irrelevantCount,
        perDeal,
        alignmentSummary,
    };
}
