
/**
 * Agent 1: Scrape Integrity Agent
 *
 * Validates field completeness, plausible value ranges,
 * and duplicate detection for scraped deal data.
 */

import { ScrapedDeal, IntegrityReport, FieldIssue } from "../types.ts";

// Plausible ranges for real estate data
const RANGES = {
    price: { min: 1_000, max: 50_000_000 },
    sqft: { min: 100, max: 100_000 },
    bedrooms: { min: 0, max: 20 },
    bathrooms: { min: 0, max: 15 },
    arv: { min: 5_000, max: 100_000_000 },
    repair_estimate: { min: 0, max: 5_000_000 },
    year_built: { min: 1800, max: new Date().getFullYear() + 1 },
    equity_percentage: { min: -100, max: 100 },
    ai_score: { min: 0, max: 100 },
};

const REQUIRED_FIELDS: (keyof ScrapedDeal)[] = ['title', 'price', 'location', 'source'];
const ENRICHMENT_FIELDS: (keyof ScrapedDeal)[] = [
    'arv', 'sqft', 'bedrooms', 'bathrooms', 'repair_estimate',
    'address', 'city', 'state', 'zip_code', 'property_type',
];

function hashAddress(deal: ScrapedDeal): string {
    const parts = [
        deal.address || deal.title,
        deal.city || '',
        deal.state || '',
    ].map(s => s.toLowerCase().replace(/\s+/g, ''));
    return parts.join('|');
}

function checkRange(
    field: string,
    value: number | undefined | null,
    range: { min: number; max: number }
): FieldIssue | null {
    if (value === undefined || value === null) return null;
    if (value < range.min || value > range.max) {
        return {
            field,
            issue: 'out_of_range',
            message: `${field} value ${value} outside plausible range [${range.min.toLocaleString()}, ${range.max.toLocaleString()}]`,
            suggestedFix: `Verify ${field} value from source`,
        };
    }
    return null;
}

export function runIntegrityCheck(deals: ScrapedDeal[]): IntegrityReport[] {
    const addressHashes = new Map<string, number>();
    const reports: IntegrityReport[] = [];

    deals.forEach((deal, index) => {
        const missingFields: string[] = [];
        const rangeViolations: FieldIssue[] = [];

        // 1. Required field completeness
        for (const field of REQUIRED_FIELDS) {
            const val = deal[field];
            if (val === undefined || val === null || val === '') {
                missingFields.push(field);
            }
        }

        // 2. Enrichment field completeness
        let enrichmentPresent = 0;
        for (const field of ENRICHMENT_FIELDS) {
            if (deal[field] !== undefined && deal[field] !== null && deal[field] !== '') {
                enrichmentPresent++;
            } else {
                missingFields.push(field);
            }
        }

        // 3. Range validation
        const rangeChecks: [string, number | undefined | null, { min: number; max: number }][] = [
            ['price', deal.price, RANGES.price],
            ['asking_price', deal.asking_price, RANGES.price],
            ['arv', deal.arv, RANGES.arv],
            ['sqft', deal.sqft, RANGES.sqft],
            ['bedrooms', deal.bedrooms, RANGES.bedrooms],
            ['bathrooms', deal.bathrooms, RANGES.bathrooms],
            ['repair_estimate', deal.repair_estimate, RANGES.repair_estimate],
            ['year_built', deal.year_built, RANGES.year_built],
            ['ai_score', deal.ai_score, RANGES.ai_score],
        ];

        for (const [field, value, range] of rangeChecks) {
            const issue = checkRange(field, value, range);
            if (issue) rangeViolations.push(issue);
        }

        // ARV vs asking price check
        if (deal.arv && deal.asking_price && deal.arv < deal.asking_price * 0.5) {
            rangeViolations.push({
                field: 'arv',
                issue: 'suspicious',
                message: `ARV ($${deal.arv.toLocaleString()}) is less than 50% of asking price ($${deal.asking_price.toLocaleString()})`,
                suggestedFix: 'Verify ARV is correct — typically ARV > asking price for investment deals',
            });
        }

        // 4. Duplicate detection
        const hash = hashAddress(deal);
        const existingIdx = addressHashes.get(hash);
        const isDuplicate = existingIdx !== undefined;
        if (!isDuplicate) {
            addressHashes.set(hash, index);
        }

        // 5. Scoring
        const requiredPresent = REQUIRED_FIELDS.length - missingFields.filter(f =>
            REQUIRED_FIELDS.includes(f as keyof ScrapedDeal)
        ).length;
        const completenessScore = Math.round(
            ((requiredPresent / REQUIRED_FIELDS.length) * 60) +
            ((enrichmentPresent / ENRICHMENT_FIELDS.length) * 40)
        );

        const plausibilityScore = Math.max(0, 100 - (rangeViolations.length * 15));

        let overallScore = Math.round((completenessScore * 0.5) + (plausibilityScore * 0.5));
        if (isDuplicate) overallScore = Math.max(0, overallScore - 20);

        reports.push({
            dealIndex: index,
            title: deal.title || `Deal #${index + 1}`,
            completenessScore,
            plausibilityScore,
            overallScore,
            missingFields,
            rangeViolations,
            isDuplicate,
            duplicateOf: existingIdx,
        });
    });

    return reports;
}
