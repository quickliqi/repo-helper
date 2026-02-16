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
    BedDouble
} from "lucide-react";
import { DealChat } from "@/components/chat/DealChat";

// Define strict types for the deal prop based on Scraper.tsx
interface DealMetrics {
    arv: number;
    mao: number;
    roi: number;
    equityPercentage: number;
    score: number;
    riskFactors: string[];
    grossEquity: number;
    projectedProfit: number;
}

export interface DealDetail {
    title: string;
    price: number;
    location: string;
    source: string;
    description: string;
    link: string;
    ai_score: number;
    reasoning: string;
    metrics: DealMetrics | null;
    validated: boolean;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    property_type?: string;
    condition?: string;
    image?: string; // Optional image URL if available
}

interface DealDetailModalProps {
    deal: DealDetail | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

export function DealDetailModal({ deal, open, onOpenChange }: DealDetailModalProps) {
    if (!deal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {deal.title}
                                {deal.validated && (
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Validated
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <MapPin className="w-4 h-4" /> {deal.location}
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">{formatCurrency(deal.price)}</div>
                            <div className="text-sm text-muted-foreground">List Price</div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                    {/* Column A: Property Details */}
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
                                        <div className={`text-2xl font-bold ${deal.metrics.equityPercentage > 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {formatCurrency(deal.metrics.grossEquity)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">({deal.metrics.equityPercentage.toFixed(1)}%)</div>
                                    </Card>
                                    <Card className="p-4 bg-muted/20">
                                        <div className="text-sm text-muted-foreground font-medium mb-1">ROI</div>
                                        <div className={`text-2xl font-bold ${deal.metrics.roi > 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {deal.metrics.roi.toFixed(1)}%
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-muted/20">
                                        <div className="text-sm text-muted-foreground font-medium mb-1">AI Score</div>
                                        <div className={`text-2xl font-bold ${deal.metrics.score >= 70 ? 'text-emerald-600' : deal.metrics.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
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
                                        <span>{deal.bedrooms ?? '-'} Beds</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bath className="w-4 h-4 text-muted-foreground" />
                                        <span>{deal.bathrooms ?? '-'} Baths</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ruler className="w-4 h-4 text-muted-foreground" />
                                        <span>{deal.sqft ?? '-'} Sq Ft</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-medium">Type:</span>
                                        <span className="capitalize">{deal.property_type ?? 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-medium">Condition:</span>
                                        <span className="capitalize">{deal.condition ?? 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

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

                    {/* Column B: AI Chat Interface */}
                    <DealChat deal={deal} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
