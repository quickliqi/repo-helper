import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Timer, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MarketDataWidgetProps {
    mode: 'fix_flip' | 'market';
    className?: string;
}

export const MarketDataWidget = ({ mode, className = '' }: MarketDataWidgetProps) => {
    if (mode === 'market') {
        return (
            <Card className={`border-primary/20 bg-gradient-to-br from-background to-primary/5 ${className}`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="animate-pulse border-primary/50 text-primary">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                LIVE SIGNAL
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">UPDATED: TODAY</span>
                        </div>
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Volume (30d)</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">142</span>
                                <span className="flex items-center text-xs font-medium text-destructive">
                                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                    12%
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Closed Dispositions</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Spread</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">$18.4k</span>
                                <span className="flex items-center text-xs font-medium text-success">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                    4.2%
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Net Assignment Fee</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Speed</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">14d</span>
                                <span className="flex items-center text-xs font-medium text-muted-foreground">
                                    <Timer className="h-3 w-3 mr-0.5" />
                                    Avg
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Contract to Close</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // default: fix_flip / deal specific stats
    return (
        <div className={`flex items-center justify-between p-4 bg-background border border-border rounded-lg shadow-sm ${className}`}>
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-foreground">Active Buy Box Demand</h4>
                    <p className="text-xs text-muted-foreground">
                        <strong className="text-primary">84 Institutional Buyers</strong> are currently sourcing this asset class.
                    </p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Users className="h-3 w-3" />
                <span>Verified Liquidity</span>
            </div>
        </div>
    );
};
