import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
    MapPin,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Building,
    Ruler,
    Bath,
    BedDouble,
    ShieldCheck,
    ShieldAlert,
    AlertCircle,
    Info,
} from "lucide-react";
import { useDealAnalyzerStore } from "@/stores/useDealAnalyzerStore";
import { DealChat } from "@/components/chat/DealChat";
import type { DealDetail } from "@/types/deal-analyzer-types";
import type { AuditReport } from "@/types/scraper-audit-types";
import { DataIntegrityWidget } from "@/components/deals/DataIntegrityWidget";

// ─── Helpers ───────────────────────────────────────────────────────
function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}

function isDealDetail(payload: unknown): payload is DealDetail {
    return typeof payload === "object" && payload !== null && "price" in payload && "title" in payload;
}

// ─── Deal Context (Left Column) ────────────────────────────────────
function DealContextPanel({ deal }: { deal: DealDetail }) {
    return (
        <ScrollArea className="h-full border-r">
            <div className="p-6 space-y-8">
                {/* Key Metrics Grid */}
                {deal.metrics && (
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 bg-muted/20">
                            <div className="text-sm text-muted-foreground font-medium mb-1">ARV</div>
                            <div className="text-2xl font-bold">{formatCurrency(deal.metrics.arv)}</div>
                        </Card>
                        <Card className="p-4 bg-muted/20">
                            <div className="text-sm text-muted-foreground font-medium mb-1">Est. Equity</div>
                            <div className={`text-2xl font-bold ${deal.metrics.equityPercentage > 20 ? "text-emerald-600" : "text-amber-600"}`}>
                                {formatCurrency(deal.metrics.grossEquity)}
                            </div>
                            <div className="text-xs text-muted-foreground">({deal.metrics.equityPercentage.toFixed(1)}%)</div>
                        </Card>
                        <Card className="p-4 bg-muted/20">
                            <div className="text-sm text-muted-foreground font-medium mb-1">ROI</div>
                            <div className={`text-2xl font-bold ${deal.metrics.roi > 15 ? "text-emerald-600" : "text-amber-600"}`}>
                                {deal.metrics.roi.toFixed(1)}%
                            </div>
                        </Card>
                        <Card className="p-4 bg-muted/20">
                            <div className="text-sm text-muted-foreground font-medium mb-1">AI Score</div>
                            <div className={`text-2xl font-bold ${deal.metrics.score >= 70 ? "text-emerald-600" : deal.metrics.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                {deal.metrics.score}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Property Specs */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Building className="w-5 h-5" /> Property Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 text-sm">
                        <div className="flex items-center gap-2">
                            <BedDouble className="w-4 h-4 text-muted-foreground" />
                            <span>{deal.bedrooms ?? "-"} Beds</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bath className="w-4 h-4 text-muted-foreground" />
                            <span>{deal.bathrooms ?? "-"} Baths</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-muted-foreground" />
                            <span>{deal.sqft ?? "-"} Sq Ft</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">Type:</span>
                            <span className="capitalize">{deal.property_type ?? "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">Condition:</span>
                            <span className="capitalize">{deal.condition ?? "Unknown"}</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Data Integrity Widget */}
                {deal.integrity && (
                    <DataIntegrityWidget integrity={deal.integrity} />
                )}

                {/* AI Analysis */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> AI Analysis
                    </h3>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                        <p className="text-sm leading-relaxed">{deal.reasoning}</p>
                    </div>
                </div>

                {/* Risk Factors */}
                {deal.metrics?.riskFactors && deal.metrics.riskFactors.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Risk Factors
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {deal.metrics.riskFactors.map((risk, i) => (
                                <Badge key={i} variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 py-1">
                                    {risk}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {deal.description && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
                    </div>
                )}

                {/* Action */}
                <div className="pt-4">
                    <Button asChild className="w-full" size="lg">
                        <a href={deal.link} target="_blank" rel="noopener noreferrer">
                            View Original Listing
                        </a>
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}

// ─── Audit Context (Left Column) ───────────────────────────────────
function AuditContextPanel({ report }: { report: AuditReport }) {
    const criticalAlerts = report.alerts.filter((a) => a.severity === "critical");
    const warningAlerts = report.alerts.filter((a) => a.severity === "warning");
    const infoAlerts = report.alerts.filter((a) => a.severity === "info");

    return (
        <ScrollArea className="h-full border-r">
            <div className="p-6 space-y-6">
                {/* Score Summary */}
                <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${report.overallScore >= 80 ? "text-emerald-600" : report.overallScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {report.overallScore}
                    </div>
                    <div>
                        <div className="font-semibold">Overall Score</div>
                        <Badge variant={report.pass ? "default" : "destructive"} className={report.pass ? "bg-emerald-600" : ""}>
                            {report.pass ? "PASS" : "REVIEW NEEDED"}
                        </Badge>
                    </div>
                </div>

                <Separator />

                {/* Critical */}
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

                {/* Warnings */}
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

                {/* Info */}
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

                {/* All clear */}
                {criticalAlerts.length === 0 && warningAlerts.length === 0 && infoAlerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                        <p>No issues found. Data integrity is high.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}

// ─── Main Modal ────────────────────────────────────────────────────
export function DealAnalyzerModal() {
    const { isOpen, contextType, dataPayload, closeDealAnalyzer } = useDealAnalyzerStore();

    if (!isOpen || !contextType || !dataPayload) return null;

    const isDeal = contextType === "deal" && isDealDetail(dataPayload);
    const deal = isDeal ? (dataPayload as DealDetail) : null;
    const audit = contextType === "audit" ? (dataPayload as AuditReport) : null;

    const title = isDeal && deal ? deal.title : "Scrape Audit Report";
    const subtitle = isDeal && deal ? deal.location : "Data integrity and issue breakdown";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDealAnalyzer(); }}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {isDeal && deal ? (
                                    <>
                                        {title}
                                        {deal.validated && (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Validated
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {audit?.pass ? (
                                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                        ) : (
                                            <ShieldAlert className="w-6 h-6 text-amber-600" />
                                        )}
                                        {title}
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                {isDeal && <MapPin className="w-4 h-4" />}
                                {subtitle}
                            </DialogDescription>
                        </div>
                        {isDeal && deal && (
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary">{formatCurrency(deal.price)}</div>
                                <div className="text-sm text-muted-foreground">List Price</div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                    {/* Left Column: Context-driven */}
                    {isDeal && deal ? (
                        <DealContextPanel deal={deal} />
                    ) : audit ? (
                        <AuditContextPanel report={audit} />
                    ) : null}

                    {/* Right Column: AI Chat (always) */}
                    <DealChat
                        contextType={contextType}
                        dataPayload={dataPayload}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
