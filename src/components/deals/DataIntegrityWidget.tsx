import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { DataIntegrity } from "@/types/deal-analyzer-types";

interface DataIntegrityWidgetProps {
    integrity: DataIntegrity;
}

function formatKey(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatValue(val: any): string {
    if (val == null) return "N/A";
    if (typeof val === "number") {
        return val > 1000
            ? `$${val.toLocaleString()}`
            : val.toString();
    }
    return String(val);
}

export function DataIntegrityWidget({ integrity }: DataIntegrityWidgetProps) {
    const { confidence_score, verified_matches, discrepancies } = integrity;
    const matchKeys = Object.keys(verified_matches);
    const discrepancyKeys = Object.keys(discrepancies);

    const scoreColor =
        confidence_score >= 80
            ? "text-emerald-600"
            : confidence_score >= 50
                ? "text-amber-600"
                : "text-red-600";

    const barColor =
        confidence_score >= 80
            ? "bg-emerald-500"
            : confidence_score >= 50
                ? "bg-amber-500"
                : "bg-red-500";

    return (
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    Public Records Verification
                </h3>
                <span className={`text-sm font-bold ${scoreColor}`}>
                    {confidence_score}% Confidence
                </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${confidence_score}%` }}
                />
            </div>

            {/* Verified Matches */}
            {matchKeys.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Verified Matches
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {matchKeys.map((key) => (
                            <Badge
                                key={key}
                                variant="outline"
                                className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs"
                            >
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                {formatKey(key)}: {formatValue(verified_matches[key])}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Discrepancies */}
            {discrepancyKeys.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Data Cautions
                    </p>
                    <div className="space-y-2">
                        {discrepancyKeys.map((key) => {
                            const { source_a, source_b } = discrepancies[key];
                            return (
                                <div
                                    key={key}
                                    className="grid grid-cols-3 items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm"
                                >
                                    <span className="font-medium text-amber-900 col-span-1">
                                        {formatKey(key)}
                                    </span>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">Listing</p>
                                        <p className="font-semibold text-amber-800">{formatValue(source_a)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">County Records</p>
                                        <p className="font-semibold text-amber-800">{formatValue(source_b)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* All Clear State */}
            {matchKeys.length === 0 && discrepancyKeys.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Verifying public records...
                </p>
            )}
        </div>
    );
}
