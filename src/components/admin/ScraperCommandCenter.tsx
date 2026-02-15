/**
 * Scraper Command Center — Full Admin Control Panel
 *
 * Controls: Start/Stop, Seed Manager, Crawl Depth, Domain Rules,
 * Relevance Threshold, Rejected Content, Stored Content, Manual Override,
 * Re-index / Purge, Real-time Logs.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Play,
    Square,
    RefreshCw,
    Trash2,
    Plus,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Globe,
    MapPin,
    Settings,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    BarChart3,
    Eye,
    Ban,
    Undo2,
    Database,
    Scan,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────

interface ScraperConfigRow {
    id: string;
    key: string;
    value: number;
    label: string;
    description: string | null;
    min_value: number;
    max_value: number;
}

interface DomainRule {
    id: string;
    domain: string;
    rule_type: 'whitelist' | 'blacklist';
    reason: string | null;
    created_at: string;
}

interface SeedEntry {
    id: string;
    city: string;
    state: string;
    source_type: string;
    is_active: boolean;
    priority: number;
    last_scraped_at: string | null;
    total_runs: number;
}

interface RejectedItem {
    id: string;
    title: string | null;
    source: string | null;
    rejection_reason: string;
    rejection_agent: string;
    confidence_score: number;
    can_override: boolean;
    overridden: boolean;
    created_at: string;
}

interface AuditLogEntry {
    id: string;
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

// ─── Sub-components ─────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────

export function ScraperCommandCenter() {
    const queryClient = useQueryClient();
    const [isRunning, setIsRunning] = useState(false);
    const [runCity, setRunCity] = useState('');
    const [runState, setRunState] = useState('');
    const [newSeedCity, setNewSeedCity] = useState('');
    const [newSeedState, setNewSeedState] = useState('');
    const [newSeedSource, setNewSeedSource] = useState('all');
    const [newDomain, setNewDomain] = useState('');
    const [newDomainType, setNewDomainType] = useState<'whitelist' | 'blacklist'>('whitelist');

    // ─── Queries ─────────────────────────────────────────────

    const { data: config, isLoading: configLoading } = useQuery({
        queryKey: ['scraper_config'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('scraper_config')
                .select('*')
                .order('key');
            if (error) throw error;
            return data as ScraperConfigRow[];
        },
    });

    const { data: domainRules, isLoading: domainsLoading } = useQuery({
        queryKey: ['scraper_domain_rules'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('scraper_domain_rules')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as DomainRule[];
        },
    });

    const { data: seeds, isLoading: seedsLoading } = useQuery({
        queryKey: ['scraper_seeds'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('scraper_seeds')
                .select('*')
                .order('priority', { ascending: false });
            if (error) throw error;
            return data as SeedEntry[];
        },
    });

    const { data: rejected, isLoading: rejectedLoading } = useQuery({
        queryKey: ['scraper_rejected_items'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('scraper_rejected_items')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data as RejectedItem[];
        },
    });

    const { data: auditLogs, isLoading: logsLoading } = useQuery({
        queryKey: ['scraper_audit_logs_admin'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('scraper_audit_logs')
                .select('id, overall_score, pass, alerts_count, integrity_score, structural_score, relevance_score, crosscheck_score, total_deals, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data as AuditLogEntry[];
        },
        refetchInterval: 15000,
    });

    // ─── Mutations ───────────────────────────────────────────

    const updateConfig = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: number }) => {
            const { error } = await (supabase as any)
                .from('scraper_config')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', key);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_config'] });
            toast.success('Config updated');
        },
        onError: () => toast.error('Failed to update config'),
    });

    const addDomainRule = useMutation({
        mutationFn: async (rule: { domain: string; rule_type: string; reason?: string }) => {
            const { error } = await (supabase as any)
                .from('scraper_domain_rules')
                .insert(rule);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_domain_rules'] });
            setNewDomain('');
            toast.success('Domain rule added');
        },
        onError: () => toast.error('Failed to add domain rule'),
    });

    const removeDomainRule = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('scraper_domain_rules')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_domain_rules'] });
            toast.success('Domain rule removed');
        },
    });

    const addSeed = useMutation({
        mutationFn: async (seed: { city: string; state: string; source_type: string }) => {
            const { error } = await (supabase as any)
                .from('scraper_seeds')
                .insert(seed);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_seeds'] });
            setNewSeedCity('');
            setNewSeedState('');
            toast.success('Seed added');
        },
        onError: () => toast.error('Failed to add seed'),
    });

    const removeSeed = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('scraper_seeds')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_seeds'] });
            toast.success('Seed removed');
        },
    });

    const overrideRejection = useMutation({
        mutationFn: async (id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await (supabase as any)
                .from('scraper_rejected_items')
                .update({
                    overridden: true,
                    overridden_by: user?.id,
                    overridden_at: new Date().toISOString(),
                })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scraper_rejected_items'] });
            toast.success('Override applied');
        },
    });

    const purgeDedup = useMutation({
        mutationFn: async () => {
            const { error } = await (supabase as any)
                .from('scraper_dedup_hashes')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
            if (error) throw error;
        },
        onSuccess: () => toast.success('Dedup index purged'),
        onError: () => toast.error('Failed to purge dedup index'),
    });

    // ─── Scraper Run ─────────────────────────────────────────

    const handleRunScraper = async (city: string, state: string) => {
        setIsRunning(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-hunter', {
                body: { city, state, admin_mode: true },
            });
            if (error) throw error;
            toast.success(`Scrape complete: ${data?.deals?.length || 0} deals found`);
            queryClient.invalidateQueries({ queryKey: ['scraper_audit_logs_admin'] });
            queryClient.invalidateQueries({ queryKey: ['scraper_rejected_items'] });
        } catch (err) {
            toast.error('Scrape failed');
            console.error(err);
        } finally {
            setIsRunning(false);
        }
    };

    // ─── Stats ───────────────────────────────────────────────

    const avgScore = auditLogs?.length
        ? Math.round(auditLogs.reduce((s, l) => s + l.overall_score, 0) / auditLogs.length)
        : 0;
    const passRate = auditLogs?.length
        ? Math.round((auditLogs.filter(l => l.pass).length / auditLogs.length) * 100)
        : 0;
    const totalAlerts = auditLogs?.reduce((s, l) => s + l.alerts_count, 0) || 0;
    const rejectedCount = rejected?.filter(r => !r.overridden).length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Scan className="h-6 w-6 text-primary" />
                    Scraper Command Center
                </h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['scraper_audit_logs_admin'] });
                            queryClient.invalidateQueries({ queryKey: ['scraper_rejected_items'] });
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 pb-4 text-center">
                        <div className="text-3xl font-bold">{auditLogs?.length || 0}</div>
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
                        <div className="text-3xl font-bold text-amber-600">{rejectedCount}</div>
                        <div className="text-sm text-muted-foreground">Rejected Items</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="controls" className="space-y-4">
                <TabsList className="flex w-full flex-wrap justify-start gap-2 h-auto p-2">
                    <TabsTrigger value="controls" className="gap-1.5">
                        <Play className="h-3.5 w-3.5" /> Controls
                    </TabsTrigger>
                    <TabsTrigger value="seeds" className="gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Seeds
                    </TabsTrigger>
                    <TabsTrigger value="domains" className="gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Domains
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-1.5">
                        <Settings className="h-3.5 w-3.5" /> Thresholds
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-1.5">
                        <Ban className="h-3.5 w-3.5" /> Rejected
                        {rejectedCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{rejectedCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" /> Audit Logs
                    </TabsTrigger>
                </TabsList>

                {/* ═══ Controls Tab ═══ */}
                <TabsContent value="controls">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Manual Scrape</CardTitle>
                                <CardDescription>Run a scrape on any city/state</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>City</Label>
                                        <Input placeholder="Atlanta" value={runCity} onChange={e => setRunCity(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>State</Label>
                                        <Input placeholder="GA" maxLength={2} value={runState} onChange={e => setRunState(e.target.value.toUpperCase())} />
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={isRunning || !runCity || !runState}
                                    onClick={() => handleRunScraper(runCity, runState)}
                                >
                                    {isRunning ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                                    ) : (
                                        <><Play className="mr-2 h-4 w-4" /> Start Scrape</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                                <CardDescription>Database management tools</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => purgeDedup.mutate()}
                                    disabled={purgeDedup.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                    Purge Dedup Index
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        queryClient.invalidateQueries();
                                        toast.success('All caches refreshed');
                                    }}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                                    Re-index All Caches
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ═══ Seeds Tab ═══ */}
                <TabsContent value="seeds">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Seed Manager</CardTitle>
                            <CardDescription>Manage target locations for scraping</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1.5 flex-1">
                                    <Label>City</Label>
                                    <Input placeholder="Atlanta" value={newSeedCity} onChange={e => setNewSeedCity(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 w-20">
                                    <Label>State</Label>
                                    <Input placeholder="GA" maxLength={2} value={newSeedState} onChange={e => setNewSeedState(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-1.5 w-28">
                                    <Label>Source</Label>
                                    <Select value={newSeedSource} onValueChange={setNewSeedSource}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="mls">MLS</SelectItem>
                                            <SelectItem value="fsbo">FSBO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={() => addSeed.mutate({ city: newSeedCity, state: newSeedState, source_type: newSeedSource })}
                                    disabled={!newSeedCity || !newSeedState || addSeed.isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>City</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Runs</TableHead>
                                        <TableHead>Last Run</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {seedsLoading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                                    ) : seeds?.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No seeds configured</TableCell></TableRow>
                                    ) : seeds?.map(seed => (
                                        <TableRow key={seed.id}>
                                            <TableCell className="font-medium">{seed.city}</TableCell>
                                            <TableCell>{seed.state}</TableCell>
                                            <TableCell><Badge variant="outline">{seed.source_type}</Badge></TableCell>
                                            <TableCell>{seed.total_runs}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {seed.last_scraped_at ? new Date(seed.last_scraped_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRunScraper(seed.city, seed.state)}
                                                        disabled={isRunning}
                                                    >
                                                        <Play className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => removeSeed.mutate(seed.id)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ Domains Tab ═══ */}
                <TabsContent value="domains">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Domain Rules</CardTitle>
                            <CardDescription>Whitelist trusted sources, blacklist spam domains</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1.5 flex-1">
                                    <Label>Domain</Label>
                                    <Input placeholder="example.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 w-32">
                                    <Label>Type</Label>
                                    <Select value={newDomainType} onValueChange={(v) => setNewDomainType(v as 'whitelist' | 'blacklist')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="whitelist">Whitelist</SelectItem>
                                            <SelectItem value="blacklist">Blacklist</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={() => addDomainRule.mutate({ domain: newDomain, rule_type: newDomainType })}
                                    disabled={!newDomain || addDomainRule.isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-2">
                                {domainsLoading ? (
                                    <div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                                ) : domainRules?.map(rule => (
                                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Badge className={rule.rule_type === 'whitelist' ? 'bg-emerald-600' : 'bg-red-600'}>
                                                {rule.rule_type === 'whitelist' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                {rule.rule_type}
                                            </Badge>
                                            <span className="font-mono text-sm">{rule.domain}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeDomainRule.mutate(rule.id)}>
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ Config/Thresholds Tab ═══ */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Scraper Thresholds</CardTitle>
                            <CardDescription>Fine-tune scoring thresholds and limits</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {configLoading ? (
                                <div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
                            ) : (
                                <div className="space-y-6">
                                    {config?.map(c => (
                                        <div key={c.key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">{c.label}</Label>
                                                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                                                </div>
                                                <span className="text-lg font-bold text-primary">{c.value}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground w-6">{c.min_value}</span>
                                                <input
                                                    type="range"
                                                    min={c.min_value}
                                                    max={c.max_value}
                                                    value={c.value}
                                                    onChange={e => {
                                                        // Optimistic local update
                                                        const newConfig = config?.map(item =>
                                                            item.key === c.key ? { ...item, value: Number(e.target.value) } : item
                                                        );
                                                        queryClient.setQueryData(['scraper_config'], newConfig);
                                                    }}
                                                    onMouseUp={e => {
                                                        updateConfig.mutate({ key: c.key, value: Number((e.target as HTMLInputElement).value) });
                                                    }}
                                                    onTouchEnd={e => {
                                                        updateConfig.mutate({ key: c.key, value: Number((e.target as HTMLInputElement).value) });
                                                    }}
                                                    className="flex-1 accent-primary cursor-pointer"
                                                />
                                                <span className="text-xs text-muted-foreground w-6">{c.max_value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ Rejected Tab ═══ */}
                <TabsContent value="rejected">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rejected Content</CardTitle>
                            <CardDescription>Items rejected by the audit pipeline. Override to approve.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rejectedLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                                    ) : rejected?.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No rejected items</TableCell></TableRow>
                                    ) : rejected?.map(item => (
                                        <TableRow key={item.id} className={item.overridden ? 'opacity-50' : ''}>
                                            <TableCell className="font-medium max-w-[200px] truncate">{item.title || '—'}</TableCell>
                                            <TableCell><Badge variant="outline">{item.rejection_agent}</Badge></TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{item.rejection_reason}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleTimeString()}</TableCell>
                                            <TableCell>
                                                {item.can_override && !item.overridden ? (
                                                    <Button variant="ghost" size="sm" onClick={() => overrideRejection.mutate(item.id)}>
                                                        <Undo2 className="h-3.5 w-3.5 text-blue-500 mr-1" /> Override
                                                    </Button>
                                                ) : item.overridden ? (
                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Overridden</Badge>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══ Audit Logs Tab ═══ */}
                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Audit Runs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {logsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : auditLogs?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No audit logs yet. Run a scrape to generate audit data.</p>
                            ) : (
                                <div className="space-y-3">
                                    {auditLogs?.map(log => (
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
