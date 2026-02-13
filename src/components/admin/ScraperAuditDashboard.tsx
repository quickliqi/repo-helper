/**
 * Admin Scraper Audit Dashboard
 *
 * Shows historical audit logs, confidence trends,
 * and actionable alert feeds for admin users.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    AlertTriangle,
    BarChart3,
    RefreshCw,
    Loader2,
    CheckCircle2,
    XCircle,
    Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
    id: string;
    session_id: string | null;
    overall_score: number;
    pass: boolean;
    alerts_count: number;
    integrity_score: number;
    structural_score: number;
    relevance_score: number;
    crosscheck_score: number;
    total_deals: number;
    created_at: string;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
    const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{score}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

export function ScraperAuditDashboard() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('scraper_audit_logs')
                .select('id, session_id, overall_score, pass, alerts_count, integrity_score, structural_score, relevance_score, crosscheck_score, total_deals, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const avgScore = logs.length > 0
        ? Math.round(logs.reduce((s, l) => s + l.overall_score, 0) / logs.length)
        : 0;
    const passRate = logs.length > 0
        ? Math.round((logs.filter(l => l.pass).length / logs.length) * 100)
        : 0;
    const totalAlerts = logs.reduce((s, l) => s + l.alerts_count, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Scraper Audit Dashboard
                </h2>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 pb-4 text-center">
                        <div className="text-3xl font-bold">{logs.length}</div>
                        <div className="text-sm text-muted-foreground">Total Audits</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 pb-4 text-center">
                        <div className={`text-3xl font-bold ${avgScore >= 70 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {avgScore}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 pb-4 text-center">
                        <div className={`text-3xl font-bold ${passRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {passRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">Pass Rate</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 pb-4 text-center">
                        <div className="text-3xl font-bold text-amber-600">{totalAlerts}</div>
                        <div className="text-sm text-muted-foreground">Total Alerts</div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Audit Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No audit logs yet. Run a scrape to generate audit data.</p>
                    ) : (
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {log.pass ? (
                                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <ShieldAlert className="h-5 w-5 text-amber-600" />
                                            )}
                                            <span className="font-bold">Score: {log.overall_score}/100</span>
                                            <Badge className={log.pass ? 'bg-emerald-600' : 'bg-amber-600'}>
                                                {log.pass ? 'PASS' : 'REVIEW'}
                                            </Badge>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div>{new Date(log.created_at).toLocaleDateString()}</div>
                                            <div>{log.total_deals} deals · {log.alerts_count} alerts</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <ScoreBar label="Integrity" score={log.integrity_score} />
                                        <ScoreBar label="Structure" score={log.structural_score} />
                                        <ScoreBar label="Relevance" score={log.relevance_score} />
                                        <ScoreBar label="Cross-Check" score={log.crosscheck_score} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
