import { AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealValidationResult, getDealQualityTier } from '@/lib/dealValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DealQualityIndicatorProps {
  validation: DealValidationResult;
  askingPrice: number;
  arv: number;
  className?: string;
}

export function DealQualityIndicator({ 
  validation, 
  askingPrice, 
  arv,
  className 
}: DealQualityIndicatorProps) {
  const { arvPercentage, potentialProfit, equityPercentage } = validation.metrics;
  const qualityTier = getDealQualityTier(arvPercentage);
  
  // Calculate the progress value (70% = 100 on our scale, lower is better)
  const progressValue = arvPercentage ? Math.min(100, (arvPercentage / 70) * 100) : 0;
  const maxAllowed = arv ? Math.floor(arv * 0.70) : 0;

  if (!askingPrice || !arv) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm">
              Enter asking price and ARV to see deal quality metrics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      validation.isValid 
        ? "border-success/30 bg-success/5" 
        : "border-destructive/30 bg-destructive/5",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            Deal Quality Check
          </span>
          <Badge 
            variant={validation.isValid ? "default" : "destructive"}
            className={cn(
              validation.isValid 
                ? "bg-success/10 text-success border-success/20 hover:bg-success/20" 
                : ""
            )}
          >
            {qualityTier.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ARV Percentage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Asking Price vs ARV</span>
            <span className={cn("font-medium", qualityTier.color)}>
              {arvPercentage?.toFixed(1)}% of ARV
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={progressValue} 
              className={cn(
                "h-3",
                validation.isValid ? "[&>div]:bg-success" : "[&>div]:bg-destructive"
              )}
            />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-foreground/50" 
              style={{ left: '100%', transform: 'translateX(-1px)' }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>Max: ${maxAllowed.toLocaleString()} (70%)</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Potential Equity</p>
            <p className="font-semibold text-foreground">
              ${potentialProfit?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Equity Percentage</p>
            <p className="font-semibold text-foreground">
              {equityPercentage?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            {validation.errors.map((error, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && validation.isValid && (
          <div className="space-y-2 pt-2 border-t border-border">
            {validation.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
