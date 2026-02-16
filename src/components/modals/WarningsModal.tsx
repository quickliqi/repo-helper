import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { AuditReport } from "@/types/scraper-audit-types";

interface WarningsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    auditReport: AuditReport | null;
}

export function WarningsModal({ open, onOpenChange, auditReport }: WarningsModalProps) {
    if (!auditReport) return null;

    const criticalAlerts = auditReport.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = auditReport.alerts.filter(a => a.severity === 'warning');
    const infoAlerts = auditReport.alerts.filter(a => a.severity === 'info');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {auditReport.pass ? (
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        ) : (
                            <ShieldAlert className="w-6 h-6 text-amber-600" />
                        )}
                        Scrape Audit Report
                        <Badge variant={auditReport.pass ? "default" : "destructive"} className={auditReport.pass ? "bg-emerald-600" : ""}>
                            Score: {auditReport.overallScore}/100
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Detailed breakdown of data integrity and potential issues found during the scrape.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 py-4">

                        {criticalAlerts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-medium text-destructive flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Critical Issues ({criticalAlerts.length})
                                </h3>
                                <div className="space-y-2">
                                    {criticalAlerts.map((alert, i) => (
                                        <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-900">
                                            <p className="font-semibold">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {warningAlerts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-medium text-amber-600 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Warnings ({warningAlerts.length})
                                </h3>
                                <div className="space-y-2">
                                    {warningAlerts.map((alert, i) => (
                                        <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-900">
                                            <p className="font-semibold">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {infoAlerts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-medium text-blue-600 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Information ({infoAlerts.length})
                                </h3>
                                <div className="space-y-2">
                                    {infoAlerts.map((alert, i) => (
                                        <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-900">
                                            <p className="font-semibold">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {criticalAlerts.length === 0 && warningAlerts.length === 0 && infoAlerts.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                                <p>No issues found. Data integrity is high.</p>
                            </div>
                        )}

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
