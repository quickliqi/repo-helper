/**
 * Agent 3: Structural Validation Agent
 * 
 * Validates scraped data against expected schemas,
 * checks type correctness, and validates enum values.
 */

import { ScrapedDeal, ScrapedDealSchema, StructuralReport, StructuralCorrection } from '../../types/scraper-audit-types';

const VALID_PROPERTY_TYPES = [
    'single_family', 'multi_family', 'condo', 'townhouse',
    'commercial', 'land', 'mobile_home', 'other'
];

const VALID_DEAL_TYPES = [
    'fix_and_flip', 'buy_and_hold', 'wholesale',
    'subject_to', 'seller_finance', 'other'
];

const VALID_CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'distressed'];

/**
 * Attempts to coerce common formatting issues in scraped data.
 * Returns corrections made plus the cleaned data.
 */
function coerceAndCorrect(rawDeal: Record<string, unknown>): {
    corrections: StructuralCorrection[];
    coerced: Record<string, unknown>;
} {
    const corrections: StructuralCorrection[] = [];
    const coerced = { ...rawDeal };

    // Price string → number (e.g. "$165,000" → 165000)
    for (const field of ['price', 'asking_price', 'arv', 'repair_estimate']) {
        const val = coerced[field];
        if (typeof val === 'string') {
            const cleaned = val.replace(/[$,\s]/g, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) {
                corrections.push({
                    field,
                    from: val,
                    to: parsed,
                    reason: `Converted string "${val}" to number ${parsed}`,
                });
                coerced[field] = parsed;
            }
        }
    }

    // Integer fields
    for (const field of ['bedrooms', 'sqft', 'lot_size_sqft', 'year_built']) {
        const val = coerced[field];
        if (typeof val === 'string') {
            const parsed = parseInt(val.replace(/[,\s]/g, ''), 10);
            if (!isNaN(parsed)) {
                corrections.push({
                    field,
                    from: val,
                    to: parsed,
                    reason: `Converted string "${val}" to integer ${parsed}`,
                });
                coerced[field] = parsed;
            }
        }
    }

    // Bathrooms (can be float like 2.5)
    if (typeof coerced.bathrooms === 'string') {
        const parsed = parseFloat(coerced.bathrooms.replace(/[,\s]/g, ''));
        if (!isNaN(parsed)) {
            corrections.push({
                field: 'bathrooms',
                from: coerced.bathrooms,
                to: parsed,
                reason: `Converted string "${coerced.bathrooms}" to number ${parsed}`,
            });
            coerced.bathrooms = parsed;
        }
    }

    // Property type normalization
    if (typeof coerced.property_type === 'string') {
        const normalized = coerced.property_type.toLowerCase().replace(/[-\s]+/g, '_');
        if (!VALID_PROPERTY_TYPES.includes(normalized) && VALID_PROPERTY_TYPES.includes(coerced.property_type.toLowerCase().replace(/\s/g, '_'))) {
            corrections.push({
                field: 'property_type',
                from: coerced.property_type,
                to: normalized,
                reason: `Normalized property type to "${normalized}"`,
            });
            coerced.property_type = normalized;
        } else if (!VALID_PROPERTY_TYPES.includes(normalized)) {
            // Map common alternatives
            const mapping: Record<string, string> = {
                'house': 'single_family',
                'home': 'single_family',
                'sfr': 'single_family',
                'sfh': 'single_family',
                'duplex': 'multi_family',
                'triplex': 'multi_family',
                'quadplex': 'multi_family',
                'apartment': 'multi_family',
                'manufactured': 'mobile_home',
                'lot': 'land',
                'vacant_land': 'land',
                'retail': 'commercial',
                'office': 'commercial',
                'industrial': 'commercial',
            };
            const mapped = mapping[normalized];
            if (mapped) {
                corrections.push({
                    field: 'property_type',
                    from: coerced.property_type,
                    to: mapped,
                    reason: `Mapped "${coerced.property_type}" to "${mapped}"`,
                });
                coerced.property_type = mapped;
            }
        }
    }

    // Condition normalization
    if (typeof coerced.condition === 'string') {
        const normalized = coerced.condition.toLowerCase().trim();
        if (!VALID_CONDITIONS.includes(normalized)) {
            const mapping: Record<string, string> = {
                'new': 'excellent',
                'like_new': 'excellent',
                'like new': 'excellent',
                'move_in_ready': 'good',
                'move in ready': 'good',
                'needs_work': 'fair',
                'needs work': 'fair',
                'fixer': 'poor',
                'fixer_upper': 'poor',
                'fixer upper': 'poor',
                'tear_down': 'distressed',
                'tear down': 'distressed',
                'condemned': 'distressed',
            };
            const mapped = mapping[normalized];
            if (mapped) {
                corrections.push({
                    field: 'condition',
                    from: coerced.condition,
                    to: mapped,
                    reason: `Mapped condition "${coerced.condition}" to "${mapped}"`,
                });
                coerced.condition = mapped;
            }
        }
    }

    return { corrections, coerced };
}

export function runStructuralValidation(deals: ScrapedDeal[]): StructuralReport {
    const perDeal = deals.map((deal, index) => {
        // First, try coercion
        const { corrections, coerced } = coerceAndCorrect(deal as unknown as Record<string, unknown>);

        // Then validate against Zod
        const result = ScrapedDealSchema.safeParse(coerced);

        const errors: Record<string, string[]> = {};
        if (!result.success) {
            result.error.issues.forEach(issue => {
                const field = issue.path.join('.') || 'general';
                if (!errors[field]) errors[field] = [];
                errors[field].push(issue.message);
            });
        }

        return {
            dealIndex: index,
            title: deal.title || `Deal #${index + 1}`,
            isValid: result.success,
            errors,
            corrections,
        };
    });

    const validCount = perDeal.filter(d => d.isValid).length;
    const invalidCount = perDeal.length - validCount;
    const complianceScore = deals.length > 0
        ? Math.round((validCount / deals.length) * 100)
        : 100;

    return {
        totalDeals: deals.length,
        validCount,
        invalidCount,
        complianceScore,
        perDeal,
    };
}
