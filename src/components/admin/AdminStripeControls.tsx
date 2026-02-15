import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, AlertTriangle, CreditCard, Zap, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StripeHealth {
    connected: boolean;
    environment: string;
    currency?: string;
    availableBalance?: number;
    pendingBalance?: number;
    error?: string;
}

interface WebhookEvent {
    id: string;
    stripe_event_id: string;
    event_type: string;
    processing_status: string;
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
}

interface ReconciliationReport {
    database: {
        transactions: number;
        subscriptions: number;
        listingCredits: number;
        scrapeCredits: number;
    };
    stripe: {
        customers: number;
        subscriptions: number;
    };
    issues: {
        failedWebhooks: number;
        recentPaymentFailures: Array<Record<string, unknown>>;
    };
    generatedAt: string;
}

async function callStripeAdmin(action: string, params?: Record<string, unknown>) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/stripe-admin`);
    url.searchParams.set('action', action);

    // For GET-style queries, add params to URL
    if (params && ['webhook-events', 'reconciliation', 'audit-log', 'health'].includes(action)) {
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined) url.searchParams.set(key, String(val));
        }
    }

    const response = await fetch(url.toString(), {
        method: ['retry-webhook', 'refund'].includes(action) ? 'POST' : 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: ['retry-webhook', 'refund'].includes(action)
            ? JSON.stringify({ action, ...params })
            : undefined,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
    }

    return response.json();
}

export function AdminStripeControls() {
    const { toast } = useToast();
    const [health, setHealth] = useState<StripeHealth | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
    const [webhookLoading, setWebhookLoading] = useState(false);
    const [webhookTotal, setWebhookTotal] = useState(0);
    const [webhookPage, setWebhookPage] = useState(1);
    const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
    const [reconciliationLoading, setReconciliationLoading] = useState(false);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundPaymentIntentId, setRefundPaymentIntentId] = useState('');
    const [refundAmount, setRefundAmount] = useState('');

    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const data = await callStripeAdmin('health');
            setHealth(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Health check failed', description: msg, variant: 'destructive' });
            setHealth({ connected: false, environment: 'unknown', error: msg });
        } finally {
            setHealthLoading(false);
        }
    }, [toast]);

    const fetchWebhookEvents = useCallback(async (page = 1) => {
        setWebhookLoading(true);
        try {
            const data = await callStripeAdmin('webhook-events', { page, limit: 10 });
            setWebhookEvents(data.events);
            setWebhookTotal(data.total);
            setWebhookPage(page);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Failed to fetch webhook events', description: msg, variant: 'destructive' });
        } finally {
            setWebhookLoading(false);
        }
    }, [toast]);

    const fetchReconciliation = useCallback(async () => {
        setReconciliationLoading(true);
        try {
            const data = await callStripeAdmin('reconciliation');
            setReconciliation(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Reconciliation failed', description: msg, variant: 'destructive' });
        } finally {
            setReconciliationLoading(false);
        }
    }, [toast]);

    const retryWebhook = async (eventId: string) => {
        try {
            await callStripeAdmin('retry-webhook', { eventId });
            toast({ title: 'Retry initiated', description: 'Event marked for re-processing' });
            await fetchWebhookEvents(webhookPage);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Retry failed', description: msg, variant: 'destructive' });
        }
    };

    const issueRefund = async () => {
        if (!refundPaymentIntentId.trim()) {
            toast({ title: 'Missing Payment Intent ID', variant: 'destructive' });
            return;
        }

        setRefundLoading(true);
        try {
            const params: Record<string, unknown> = { paymentIntentId: refundPaymentIntentId };
            if (refundAmount) params.amount = parseInt(refundAmount, 10);

            const data = await callStripeAdmin('refund', params);
            toast({
                title: 'Refund issued',
                description: `Refund ${data.refundId}: $${(data.amount / 100).toFixed(2)} ${data.currency?.toUpperCase()}`,
            });
            setRefundPaymentIntentId('');
            setRefundAmount('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Refund failed', description: msg, variant: 'destructive' });
        } finally {
            setRefundLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    const statusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            processing: 'secondary',
            failed: 'destructive',
            duplicate: 'outline',
            pending: 'secondary',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Stripe Connection
                        </CardTitle>
                        <CardDescription>API connection status and environment</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchHealth} disabled={healthLoading}>
                        {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent>
                    {health ? (
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                {health.connected ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="font-medium">{health.connected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <Badge variant={health.environment === 'live' ? 'destructive' : 'secondary'}>
                                {health.environment === 'live' ? '🔴 LIVE' : health.environment === 'test' ? '🟡 TEST' : '⚪ Unknown'}
                            </Badge>
                            {health.connected && (
                                <>
                                    <span className="text-sm text-muted-foreground">
                                        Balance: ${((health.availableBalance || 0) / 100).toFixed(2)} {health.currency?.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        Pending: ${((health.pendingBalance || 0) / 100).toFixed(2)}
                                    </span>
                                </>
                            )}
                            {health.error && (
                                <span className="text-sm text-red-500">{health.error}</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking connection...
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Webhook Events */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Webhook Events
                        </CardTitle>
                        <CardDescription>Recent Stripe webhook deliveries ({webhookTotal} total)</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchWebhookEvents(1)} disabled={webhookLoading}>
                        {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent>
                    {webhookEvents.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4">Event Type</th>
                                            <th className="pb-2 pr-4">Status</th>
                                            <th className="pb-2 pr-4">Stripe ID</th>
                                            <th className="pb-2 pr-4">Time</th>
                                            <th className="pb-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {webhookEvents.map((evt) => (
                                            <tr key={evt.id} className="border-b border-border/50">
                                                <td className="py-2 pr-4 font-mono text-xs">{evt.event_type}</td>
                                                <td className="py-2 pr-4">{statusBadge(evt.processing_status)}</td>
                                                <td className="py-2 pr-4 font-mono text-xs max-w-[140px] truncate" title={evt.stripe_event_id}>
                                                    {evt.stripe_event_id.slice(0, 20)}...
                                                </td>
                                                <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                    {new Date(evt.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-2">
                                                    {evt.processing_status === 'failed' && (
                                                        <Button variant="ghost" size="sm" onClick={() => retryWebhook(evt.id)}>
                                                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={webhookPage <= 1}
                                    onClick={() => fetchWebhookEvents(webhookPage - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {webhookPage} of {Math.ceil(webhookTotal / 10)}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={webhookPage * 10 >= webhookTotal}
                                    onClick={() => fetchWebhookEvents(webhookPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {webhookLoading ? 'Loading...' : 'No webhook events found. Click refresh to load.'}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Reconciliation Report */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Reconciliation
                        </CardTitle>
                        <CardDescription>Compare Stripe records vs database records</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchReconciliation} disabled={reconciliationLoading}>
                        {reconciliationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Report'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {reconciliation ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Database Records</h4>
                                <div className="space-y-1 text-sm">
                                    <p>Transactions: <strong>{reconciliation.database.transactions}</strong></p>
                                    <p>Subscriptions: <strong>{reconciliation.database.subscriptions}</strong></p>
                                    <p>Listing Credits: <strong>{reconciliation.database.listingCredits}</strong></p>
                                    <p>Scrape Credits: <strong>{reconciliation.database.scrapeCredits}</strong></p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Stripe Records</h4>
                                <div className="space-y-1 text-sm">
                                    <p>Customers: <strong>{reconciliation.stripe.customers}</strong></p>
                                    <p>Subscriptions: <strong>{reconciliation.stripe.subscriptions}</strong></p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Issues</h4>
                                <div className="space-y-1 text-sm">
                                    <p className={reconciliation.issues.failedWebhooks > 0 ? 'text-red-500 font-semibold' : ''}>
                                        Failed Webhooks: <strong>{reconciliation.issues.failedWebhooks}</strong>
                                    </p>
                                    <p>Recent Failures: <strong>{reconciliation.issues.recentPaymentFailures.length}</strong></p>
                                </div>
                            </div>
                            <p className="col-span-full text-xs text-muted-foreground">
                                Report generated: {new Date(reconciliation.generatedAt).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Click "Generate Report" to compare records.</p>
                    )}
                </CardContent>
            </Card>

            {/* Manual Refund */}
            <Card className="border-red-200 dark:border-red-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <DollarSign className="h-5 w-5" />
                        Manual Refund Tool
                    </CardTitle>
                    <CardDescription>Issue refunds directly through Stripe. Super admin access only.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="Payment Intent ID (pi_...)"
                            value={refundPaymentIntentId}
                            onChange={(e) => setRefundPaymentIntentId(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <Input
                            placeholder="Amount (cents, optional for full)"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            type="number"
                            className="sm:max-w-[200px]"
                        />
                        <Button
                            variant="destructive"
                            onClick={issueRefund}
                            disabled={refundLoading || !refundPaymentIntentId.trim()}
                            className="sm:min-w-[120px]"
                        >
                            {refundLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Issue Refund
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
