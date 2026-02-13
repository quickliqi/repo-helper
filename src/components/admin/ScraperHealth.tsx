import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ScraperLog {
    id: string;
    created_at: string;
    overall_score: number;
    pass: boolean;
    total_deals: number;
    alerts_count: number;
}

export function ScraperHealth() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["scraper_audit_logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("scraper_audit_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            return data as ScraperLog[];
        },
        refetchInterval: 30000,
    });

    const passRate = logs?.length
        ? (logs.filter(l => l.pass).length / logs.length) * 100
        : 0;

    const averageScore = logs?.length
        ? logs.reduce((acc, curr) => acc + curr.overall_score, 0) / logs.length
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Pass Rate</CardTitle>
                        {passRate > 80 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{passRate.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Last {logs?.length || 0} runs
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
                        <div className="text-muted-foreground text-xs">0-100</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore.toFixed(0)}</div>
                        <Progress value={averageScore} className="mt-2 h-2" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Audit Logs</CardTitle>
                    <CardDescription>Real-time feed of scraper integrity checks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Deals</TableHead>
                                <TableHead>Alerts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : logs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No logs found.</TableCell>
                                </TableRow>
                            ) : (
                                logs?.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell>
                                            {log.pass ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">PASS</Badge>
                                            ) : (
                                                <Badge variant="destructive">FAIL</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${log.overall_score < 70 ? 'text-red-500' : 'text-green-600'}`}>
                                                {log.overall_score}
                                            </span>
                                        </TableCell>
                                        <TableCell>{log.total_deals}</TableCell>
                                        <TableCell>
                                            {log.alerts_count > 0 ? (
                                                <span className="flex items-center text-yellow-600">
                                                    <AlertTriangle className="mr-1 h-3 w-3" /> {log.alerts_count}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
