/**
 * Scraper Audit Orchestrator (v2)
 *
 * Enhanced pipeline:
 * Integrity → Dedup → Structural → Relevance → Cross-Check → Monitoring
 *
 * Now fetches config from DB, integrates dedup engine,
 * and logs rejected items.
 */

import { ScrapedDeal, AuditReport } from '../../types/scraper-audit-types';
import { runIntegrityCheck } from './integrity-agent';
import { runStructuralValidation } from './structural-agent';
import { runRelevanceCheck } from './relevance-agent';
import { runCrossCheck } from './crosscheck-agent';
import { generateAlerts, logAuditReport } from './monitoring-agent';
import { runDedup, registerDedupHashes, DedupReport } from './dedup-engine';
import { supabase } from '@/integrations/supabase/client';

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

interface ScraperConfig {
    passThreshold: number;
    dedup_price_variance: number;
}

/**
 * Fetch orchestrator config from scraper_config table.
 */
async function fetchOrchestratorConfig(): Promise<ScraperConfig> {
    const defaults: ScraperConfig = {
        passThreshold: 60,
        dedup_price_variance: 5,
    };

    try {
        const { data } = await (supabase as any)
            .from('scraper_config')
            .select('key, value')
            .in('key', ['pass_threshold', 'dedup_price_variance']);

        if (data) {
            for (const row of data) {
                if (row.key === 'pass_threshold') defaults.passThreshold = Number(row.value);
                if (row.key === 'dedup_price_variance') defaults.dedup_price_variance = Number(row.value);
            }
        }
    } catch {
        console.warn('[AUDIT-ORCHESTRATOR] Failed to fetch config, using defaults');
    }

    return defaults;
}

/**
 * Log rejected items to the scraper_rejected_items table.
 */
async function logRejectedItems(
    deals: ScrapedDeal[],
    rejections: { dealIndex: number; reason: string; agent: string }[],
    sessionId?: string
): Promise<void> {
    if (rejections.length === 0) return;

    const rows = rejections.map(r => ({
        session_id: sessionId || null,
        raw_data: deals[r.dealIndex],
        rejection_reason: r.reason,
        rejection_agent: r.agent,
        title: deals[r.dealIndex]?.title || `Deal #${r.dealIndex + 1}`,
        source: deals[r.dealIndex]?.source || 'unknown',
        confidence_score: 0,
    }));

    try {
        await (supabase as any)
            .from('scraper_rejected_items')
            .insert(rows);
    } catch (err) {
        console.error('[AUDIT-ORCHESTRATOR] Failed to log rejections:', err);
    }
}

/**
 * Run the full audit pipeline on a set of scraped deals.
 */
export async function auditScrapedDeals(
    deals: ScrapedDeal[],
    buyBoxes: BuyBoxForAudit[],
    userId: string,
    sessionId?: string
): Promise<AuditReport & { dedup?: DedupReport }> {
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

    // Fetch dynamic config
    const config = await fetchOrchestratorConfig();
    console.log(`[AUDIT-ORCHESTRATOR] Starting audit pipeline for ${deals.length} deals (pass threshold: ${config.passThreshold})`);

    const rejections: { dealIndex: number; reason: string; agent: string }[] = [];

    // 1. Integrity Check
    const integrityReports = runIntegrityCheck(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Integrity check complete`);

    // 2. Dedup Engine (NEW)
    const dedupReport = await runDedup(deals, config.dedup_price_variance);
    console.log(`[AUDIT-ORCHESTRATOR] Dedup complete (${dedupReport.duplicateCount} duplicates found)`);

    // Log duplicate rejections
    for (const d of dedupReport.perDeal) {
        if (d.result.isDuplicate) {
            rejections.push({
                dealIndex: d.dealIndex,
                reason: `Duplicate: ${d.result.matchType} (similarity: ${d.result.similarity}%)${d.result.crossSessionDuplicate ? ' — previously seen' : ''}`,
                agent: 'Dedup',
            });
        }
    }

    // 3. Structural Validation
    const structuralReport = runStructuralValidation(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Structural validation complete (compliance: ${structuralReport.complianceScore}%)`);

    // 4. Relevance Check (now async with domain + keyword + config)
    const relevanceReport = await runRelevanceCheck(deals, buyBoxes);
    console.log(`[AUDIT-ORCHESTRATOR] Relevance check complete (${relevanceReport.relevantCount}/${relevanceReport.totalDeals} relevant)`);

    // Log irrelevant rejections
    for (const d of relevanceReport.perDeal) {
        if (!d.isRelevant) {
            rejections.push({
                dealIndex: d.dealIndex,
                reason: d.reasons.join('; '),
                agent: 'Relevance',
            });
        }
    }

    // 5. Cross-Check
    const crossCheckReport = runCrossCheck(deals);
    console.log(`[AUDIT-ORCHESTRATOR] Cross-check complete (${crossCheckReport.mismatchCount} mismatches)`);

    // 6. Generate alerts
    const alerts = generateAlerts(integrityReports, structuralReport, relevanceReport, crossCheckReport);
    console.log(`[AUDIT-ORCHESTRATOR] ${alerts.length} alerts generated`);

    // 7. Calculate overall score
    const integrityAvg = integrityReports.length > 0
        ? integrityReports.reduce((s, r) => s + r.overallScore, 0) / integrityReports.length
        : 100;

    const relevanceScore = relevanceReport.totalDeals > 0
        ? (relevanceReport.relevantCount / relevanceReport.totalDeals) * 100
        : 100;

    const crossCheckScore = crossCheckReport.totalDeals > 0
        ? ((crossCheckReport.totalDeals - crossCheckReport.mismatchCount) / crossCheckReport.totalDeals) * 100
        : 100;

    // Incorporate dedup into scoring
    const dedupScore = dedupReport.totalDeals > 0
        ? (dedupReport.uniqueCount / dedupReport.totalDeals) * 100
        : 100;

    const overallScore = Math.round(
        (integrityAvg * 0.25) +
        (structuralReport.complianceScore * 0.20) +
        (relevanceScore * 0.20) +
        (crossCheckScore * 0.20) +
        (dedupScore * 0.15)
    );

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const pass = overallScore >= config.passThreshold && criticalAlerts === 0;

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

    // 8. Log to database (fire and forget)
    logAuditReport(report, userId, sessionId).catch(err =>
        console.error('[AUDIT-ORCHESTRATOR] Logging error:', err)
    );

    // 9. Log rejected items (fire and forget)
    logRejectedItems(deals, rejections, sessionId).catch(err =>
        console.error('[AUDIT-ORCHESTRATOR] Rejection logging error:', err)
    );

    // 10. Register dedup hashes for future sessions
    registerDedupHashes(deals, dedupReport).catch(err =>
        console.error('[AUDIT-ORCHESTRATOR] Dedup hash registration error:', err)
    );

    console.log(`[AUDIT-ORCHESTRATOR] Audit complete. Score: ${overallScore}/100. Pass: ${pass}. Rejections: ${rejections.length}`);

    return { ...report, dedup: dedupReport };
}
