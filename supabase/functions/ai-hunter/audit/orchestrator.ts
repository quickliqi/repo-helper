
/**
 * Scraper Audit Orchestrator
 *
 * Coordinates the multi-agent audit pipeline:
 * 1. Integrity Check (Missing fields, duplicates)
 * 2. Structural Validation (Schema compliance, type coercion)
 * 3. Dedup Engine (Cross-session & fuzzy matching)
 * 4. Relevance Check (Buy box matching, domain rules)
 * 5. Cross-Check (Calculator validation, drift detection)
 * 6. Monitoring (Logging & Alerting)
 */

import { ScrapedDeal, AuditReport, BuyBoxForAudit } from "./types.ts";
import { runIntegrityCheck } from "./agents/integrity-agent.ts";
import { runStructuralValidation } from "./agents/structural-agent.ts";
import { runDedup, registerDedupHashes } from "./agents/dedup-engine.ts";
import { runRelevanceCheck } from "./agents/relevance-agent.ts";
import { runCrossCheck } from "./agents/crosscheck-agent.ts";
import { generateAlerts, logAuditReport } from "./agents/monitoring-agent.ts";

export async function auditScrapedDeals(
    deals: ScrapedDeal[],
    buyBoxes: BuyBoxForAudit[],
    userId: string,
    sessionId: string | undefined,
    supabaseClient: any
): Promise<AuditReport> {
    console.log(`[AUDIT] Starting pipeline for ${deals.length} deals...`);

    // 0. Fetch Config (Optimistic / Parallel with other non-dependent fetches later?)
    // For now, we fetch inside agents where needed (relevance, dedup)

    // 1. Integrity Agent
    const integrityReport = runIntegrityCheck(deals);

    // 2. Structural Agent
    const structuralReport = runStructuralValidation(deals);

    // 3. Dedup Engine (Async - hits DB)
    const dedupReport = await runDedup(deals, supabaseClient);

    // 4. Relevance Agent (Async - hits DB for config & rules)
    const relevanceReport = await runRelevanceCheck(deals, buyBoxes, supabaseClient);

    // 5. Cross-Check Agent
    const crossCheckReport = runCrossCheck(deals);

    // 6. Monitoring & Alerts
    const alerts = generateAlerts(
        integrityReport,
        structuralReport,
        relevanceReport,
        crossCheckReport
    );

    // Calculate Overall Score
    // Weighted average: Integrity (30%), Structural (10%), Relevance (45%), CrossCheck (15%)
    // Dedup is folded into Integrity/Relevance implicitly by filtering, but let's explicit penalize in integrity
    const integrityAvg = integrityReport.reduce((s, r) => s + r.overallScore, 0) / Math.max(1, deals.length);
    const structuralScore = structuralReport.complianceScore;
    const relevanceScore = relevanceReport.relevantCount / Math.max(1, deals.length) * 100;
    const crossCheckScore = (crossCheckReport.totalDeals - crossCheckReport.mismatchCount) / Math.max(1, crossCheckReport.totalDeals) * 100;

    const weightedScore = Math.round(
        (integrityAvg * 0.30) +
        (structuralScore * 0.10) +
        (relevanceScore * 0.45) +
        (crossCheckScore * 0.15)
    );

    // Fetch pass threshold from config
    let passThreshold = 70;
    try {
        const { data } = await supabaseClient
            .from('scraper_config')
            .select('value')
            .eq('key', 'pass_threshold')
            .single();
        if (data) passThreshold = Number(data.value);
    } catch { /* ignore */ }

    const report: AuditReport = {
        timestamp: new Date().toISOString(),
        sessionId,
        totalDeals: deals.length,
        overallScore: weightedScore,
        pass: weightedScore >= passThreshold,
        integrity: integrityReport,
        structural: structuralReport,
        relevance: relevanceReport,
        crossCheck: crossCheckReport,
        alerts,
    };

    // 7. Side Effects (Logging, Registration)
    // Register new unique hashes for future dedup
    await registerDedupHashes(deals, dedupReport, supabaseClient);

    // Log rejected items (Optional - if we want to log failures specifically different from the audit log)
    // For now, the generic audit log captures the full report

    // Log final report
    await logAuditReport(report, userId, sessionIdentity, supabaseClient);

    return report;
}
