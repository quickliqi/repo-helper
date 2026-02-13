/**
 * Scraper Audit Orchestrator
 * 
 * Runs the full audit pipeline:
 * Integrity → Structural → Relevance → Cross-Check → Monitoring
 * 
 * Returns an aggregate AuditReport with pass/fail decision.
 */

import { ScrapedDeal, AuditReport } from '../../types/scraper-audit-types';
import { runIntegrityCheck } from './integrity-agent';
import { runStructuralValidation } from './structural-agent';
import { runRelevanceCheck } from './relevance-agent';
import { runCrossCheck } from './crosscheck-agent';
import { generateAlerts, logAuditReport } from './monitoring-agent';

interface BuyBoxForAudit {
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

const PASS_THRESHOLD = 60; // Overall score must be >= 60 to pass

/**
 * Run the full audit pipeline on a set of scraped deals.
 */
export async function auditScrapedDeals(
    deals: ScrapedDeal[],
    buyBoxes: BuyBoxForAudit[],
    userId: string,
    sessionId?: string
): Promise<AuditReport> {
    if (deals.length === 0) {
        const emptyReport: AuditReport = {
            timestamp: new Date().toISOString(),
            sessionId,
            totalDeals: 0,
            overallScore: 100,
            pass: true,
            integrity: [],
            structural: { totalDeals: 0, validCount: 0, invalidCount: 0, complianceScore: 100, perDeal: [] },
            relevance: { totalDeals: 0, relevantCount: 0, irrelevantCount: 0, perDeal: [], alignmentSummary: 'No deals to audit.' },
            crossCheck: { totalDeals: 0, mismatchCount: 0, perDeal: [], recommendations: [] },
            alerts: [],
        };
        return emptyReport;
    }

    console.log(`[AUDIT-ORCHESTRATOR] Starting audit pipeline for ${deals.length} deals`);

    // 1. Integrity Check
    const integrityReports = runIntegrityCheck(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Integrity check complete`);

    // 2. Structural Validation
    const structuralReport = runStructuralValidation(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Structural validation complete (compliance: ${structuralReport.complianceScore}%)`);

    // 3. Relevance Check
    const relevanceReport = runRelevanceCheck(deals, buyBoxes);
    console.log(`[AUDIT-ORCHESTRATOR] Relevance check complete (${relevanceReport.relevantCount}/${relevanceReport.totalDeals} relevant)`);

    // 4. Cross-Check
    const crossCheckReport = runCrossCheck(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Cross-check complete (${crossCheckReport.mismatchCount} mismatches)`);

    // 5. Generate alerts
    const alerts = generateAlerts(integrityReports, structuralReport, relevanceReport, crossCheckReport);
    console.log(`[AUDIT-ORCHESTRATOR] ${alerts.length} alerts generated`);

    // 6. Calculate overall score
    const integrityAvg = integrityReports.length > 0
        ? integrityReports.reduce((s, r) => s + r.overallScore, 0) / integrityReports.length
        : 100;

    const relevanceScore = relevanceReport.totalDeals > 0
        ? (relevanceReport.relevantCount / relevanceReport.totalDeals) * 100
        : 100;

    const crossCheckScore = crossCheckReport.totalDeals > 0
        ? ((crossCheckReport.totalDeals - crossCheckReport.mismatchCount) / crossCheckReport.totalDeals) * 100
        : 100;

    const overallScore = Math.round(
        (integrityAvg * 0.30) +
        (structuralReport.complianceScore * 0.25) +
        (relevanceScore * 0.20) +
        (crossCheckScore * 0.25)
    );

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const pass = overallScore >= PASS_THRESHOLD && criticalAlerts === 0;

    const report: AuditReport = {
        timestamp: new Date().toISOString(),
        sessionId,
        totalDeals: deals.length,
        overallScore,
        pass,
        integrity: integrityReports,
        structural: structuralReport,
        relevance: relevanceReport,
        crossCheck: crossCheckReport,
        alerts,
    };

    // 6. Log to database (fire and forget)
    logAuditReport(report, userId, sessionId).catch(err =>
        console.error('[AUDIT-ORCHESTRATOR] Logging error:', err)
    );

    console.log(`[AUDIT-ORCHESTRATOR] Audit complete. Score: ${overallScore}/100. Pass: ${pass}`);

    return report;
}
