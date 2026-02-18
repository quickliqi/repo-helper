
/**
 * Agent 7: Assessor Validation Agent
 * 
 * Cross-references scraped listing data against official county
 * assessor records to detect unpermitted additions or inflated data.
 */

import { ScrapedDeal, AssessorReport, AssessorMismatch } from "../types.ts";
import { AssessorData } from "../../enrichment-service.ts";

export function runAssessorValidation(
    deals: ScrapedDeal[],
    enrichedData: (AssessorData | null)[]
): AssessorReport[] {
    return deals.map((deal, index) => {
        const assessor = enrichedData[index];
        const mismatches: AssessorMismatch[] = [];

        if (!assessor) {
            return {
                dealIndex: index,
                title: deal.title,
                hasAssessorData: false,
                mismatches: [],
                score: 100 // Can't penalize if data is missing
            };
        }

        // 1. SqFt Validation (Allow 5% variance)
        if (deal.sqft && assessor.sqft) {
            const diff = Math.abs(deal.sqft - assessor.sqft);
            const percentDiff = (diff / assessor.sqft) * 100;
            if (percentDiff > 5) {
                mismatches.push({
                    field: "sqft",
                    listingValue: deal.sqft,
                    assessorValue: assessor.sqft,
                    message: `SqFt discrepancy: Listing says ${deal.sqft}, Assessor says ${assessor.sqft} (${Math.round(percentDiff)}% difference)`
                });
            }
        }

        // 2. Bedrooms Validation
        if (deal.bedrooms !== undefined && assessor.bedrooms !== null) {
            if (deal.bedrooms !== assessor.bedrooms) {
                mismatches.push({
                    field: "bedrooms",
                    listingValue: deal.bedrooms,
                    assessorValue: assessor.bedrooms,
                    message: `Bedroom count mismatch: Listing says ${deal.bedrooms}, Assessor says ${assessor.bedrooms}`
                });
            }
        }

        // 3. Bathrooms Validation
        if (deal.bathrooms !== undefined && assessor.bathrooms !== null) {
            // Compare as numbers to handle 2 vs 2.0
            if (Math.abs(deal.bathrooms - assessor.bathrooms) >= 0.5) {
                mismatches.push({
                    field: "bathrooms",
                    listingValue: deal.bathrooms,
                    assessorValue: assessor.bathrooms,
                    message: `Bathroom count mismatch: Listing says ${deal.bathrooms}, Assessor says ${assessor.bathrooms}`
                });
            }
        }

        // Calculate score
        // Each mismatch drops the score by 25 points
        const score = Math.max(0, 100 - (mismatches.length * 25));

        return {
            deal_index: index, // Fixed index naming per orchestrator pattern if needed, but using camelCase for consistency with types
            dealIndex: index,
            title: deal.title,
            hasAssessorData: true,
            mismatches,
            score
        };
    });
}
