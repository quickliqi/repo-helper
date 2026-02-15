
/**
 * Agent 5: Monitoring & Alert Agent
 *
 * Generates actionable alerts from audit reports and
 * logs results to the scraper_audit_logs table.
 */

import { AuditReport, AuditAlert, IntegrityReport, StructuralReport, RelevanceReport, CrossCheckReport } from "../types.ts";

export function generateAlerts(
    integrityReports: IntegrityReport[],
    structural: StructuralReport,
    relevance: RelevanceReport,
    crossCheck: CrossCheckReport
): AuditAlert[] {
    const alerts: AuditAlert[] = [];

    // Integrity alerts
    for (const report of integrityReports) {
        if (report.overallScore < 50) {
            alerts.push({
                severity: 'critical',
                agentName: 'Integrity',
                dealIndex: report.dealIndex,
                dealTitle: report.title,
                message: `Deal "${report.title}" integrity score critically low (${report.overallScore}/100)`,
                suggestedFix: report.missingFields.length > 0
                    ? `Missing fields: ${report.missingFields.slice(0, 5).join(', ')}`
                    : 'Review range violations',
            });
        } else if (report.overallScore < 70) {
            alerts.push({
                severity: 'warning',
                agentName: 'Integrity',
                dealIndex: report.dealIndex,
                dealTitle: report.title,
                message: `Deal "${report.title}" has incomplete data (score: ${report.overallScore}/100)`,
                suggestedFix: `Missing: ${report.missingFields.slice(0, 3).join(', ')}`,
            });
        }

        if (report.isDuplicate) {
            alerts.push({
                severity: 'warning',
                agentName: 'Integrity',
                dealIndex: report.dealIndex,
                dealTitle: report.title,
                message: `Duplicate detected: "${report.title}" matches deal #${(report.duplicateOf || 0) + 1}`,
                suggestedFix: 'Remove duplicate or verify as distinct listing',
            });
        }

        for (const violation of report.rangeViolations) {
            if (violation.issue === 'out_of_range') {
                alerts.push({
                    severity: 'warning',
                    agentName: 'Integrity',
                    dealIndex: report.dealIndex,
                    dealTitle: report.title,
                    message: violation.message,
                    suggestedFix: violation.suggestedFix,
                });
            }
        }
    }

    // Structural alerts
    if (structural.complianceScore < 60) {
        alerts.push({
            severity: 'critical',
            agentName: 'Structural',
            message: `Schema compliance critically low: ${structural.complianceScore}% (${structural.invalidCount} of ${structural.totalDeals} invalid)`,
            suggestedFix: 'Review scraper output format — data may not match expected schema',
        });
    }

    for (const perDeal of structural.perDeal) {
        if (!perDeal.isValid) {
            const errorFields = Object.keys(perDeal.errors).slice(0, 3).join(', ');
            alerts.push({
                severity: 'warning',
                agentName: 'Structural',
                dealIndex: perDeal.dealIndex,
                dealTitle: perDeal.title,
                message: `Schema violation in "${perDeal.title}": fields [${errorFields}]`,
                suggestedFix: perDeal.corrections.length > 0
                    ? `Auto-corrected ${perDeal.corrections.length} field(s)`
                    : 'Manual correction required',
            });
        }
    }

    // Relevance alerts
    if (relevance.irrelevantCount > relevance.totalDeals * 0.5) {
        alerts.push({
            severity: 'warning',
            agentName: 'Relevance',
            message: `${relevance.irrelevantCount} of ${relevance.totalDeals} deals don't match buy box criteria`,
            suggestedFix: 'Refine search parameters or update buy box to match available inventory',
        });
    }

    // Cross-check alerts
    for (const perDeal of crossCheck.perDeal) {
        for (const mismatch of perDeal.mismatches) {
            alerts.push({
                severity: mismatch.deviationPercent > 20 ? 'critical' : 'warning',
                agentName: 'CrossCheck',
                dealIndex: perDeal.dealIndex,
                dealTitle: perDeal.title,
                message: `${mismatch.field} deviation: reported ${mismatch.reportedValue}, calculated ${mismatch.calculatedValue} (${mismatch.deviationPercent}% off)`,
                suggestedFix: 'Verify source data values against calculator formulas',
            });
        }
        for (const flag of perDeal.driftFlags) {
            alerts.push({
                severity: 'info',
                agentName: 'CrossCheck',
                dealIndex: perDeal.dealIndex,
                dealTitle: perDeal.title,
                message: flag,
            });
        }
    }

    for (const rec of crossCheck.recommendations) {
        alerts.push({
            severity: 'info',
            agentName: 'CrossCheck',
            message: rec,
        });
    }

    return alerts;
}

export async function logAuditReport(
    report: AuditReport,
    userId: string,
    sessionId: string | undefined,
    supabaseClient: any
): Promise<void> {
    try {
        const integrityAvg = report.integrity.length > 0
            ? Math.round(report.integrity.reduce((s, r) => s + r.overallScore, 0) / report.integrity.length)
            : 0;

        const { error } = await supabaseClient
            .from('scraper_audit_logs')
            .insert({
                session_id: sessionId || null,
                user_id: userId,
                audit_report: report,
                overall_score: report.overallScore,
                pass: report.pass,
                alerts_count: report.alerts.length,
                integrity_score: integrityAvg,
                structural_score: report.structural.complianceScore,
                relevance_score: report.relevance.totalDeals > 0
                    ? Math.round((report.relevance.relevantCount / report.relevance.totalDeals) * 100)
                    : 0,
                crosscheck_score: report.crossCheck.totalDeals > 0
                    ? Math.round(((report.crossCheck.totalDeals - report.crossCheck.mismatchCount) / report.crossCheck.totalDeals) * 100)
                    : 0,
                total_deals: report.totalDeals,
            });
        if (error) throw error;
    } catch (err) {
        console.error('[MONITORING-AGENT] Error logging audit:', err);
    }
}
