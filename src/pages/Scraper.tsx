import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scan,
  Search,
  Database,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  MapPin,
  DollarSign,
  TrendingUp,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BarChart3,
  ExternalLink,
  BrainCircuit,
  AlertTriangle,
  Lock,
  ArrowRight,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { auditScrapedDeals } from '@/lib/scraper-audit/orchestrator';
import type { ScrapedDeal, AuditReport } from '@/types/scraper-audit-types';
import { DealAnalyzerModal } from '@/components/modals/DealAnalyzerModal';
import { useDealAnalyzerStore } from '@/stores/useDealAnalyzerStore';
import type { DealDetail } from '@/types/deal-analyzer-types';
import { calculateDealMetrics } from '@/lib/calculations';
import type { DealInput } from '@/types/deal-types';

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

interface ScrapeResult {
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
}

interface SourceBreakdown {
  mls: number;
  fsbo: number;
  fallback: number;
}



function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getAuditBadge(dealIndex: number, audit: AuditReport | null, onClick?: () => void) {
  if (!audit) return null;
  const integrity = audit.integrity.find(r => r.dealIndex === dealIndex);
  if (!integrity) return null;

  if (integrity.overallScore >= 80) {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-200" onClick={onClick}>
        <ShieldCheck className="h-3 w-3" /> Verified
      </Badge>
    );
  } else if (integrity.overallScore >= 50) {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200 cursor-pointer hover:bg-amber-200" onClick={onClick}>
        <ShieldAlert className="h-3 w-3" /> Caution
      </Badge>
    );
  } else {
    return (
      <Badge className="gap-1 bg-red-100 text-red-700 border-red-200 cursor-pointer hover:bg-red-200" onClick={onClick}>
        <ShieldX className="h-3 w-3" /> Review
      </Badge>
    );
  }
}


const ScraperLanding = ({ onTryFree, hasCredits }: { onTryFree: () => void, hasCredits: boolean }) => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center py-16 px-4">
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-1.5 text-sm">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Hunter Engine
        </Badge>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Finding Off-Market Deals <br />
          <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Just Got Unfair.
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Stop digging through thousands of listings. Our AI Agent scans MLS, Craigslist, and FSBO sources, runs the numbers, and delivers only the deals with <strong>real equity</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-left py-8">
        <Card className="bg-background/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all">
          <CardHeader>
            <Globe className="w-10 h-10 text-primary mb-2" />
            <CardTitle>Global Scan</CardTitle>
            <CardDescription>MLS & off-market sources analyzed simultaneously.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-background/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all">
          <CardHeader>
            <BrainCircuit className="w-10 h-10 text-primary mb-2" />
            <CardTitle>AI Validation</CardTitle>
            <CardDescription>Calculator Agent checks equity, ARV, and ROI automatically.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-background/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all">
          <CardHeader>
            <Target className="w-10 h-10 text-primary mb-2" />
            <CardTitle>Precision Hunting</CardTitle>
            <CardDescription>Only shows deals matching your exact buy box criteria.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {hasCredits ? (
          <Button size="lg" onClick={onTryFree} className="h-14 px-8 text-lg shadow-lg shadow-primary/25 animate-pulse-hover">
            <Zap className="w-5 h-5 mr-2" />
            Try 1 Free Scrape
          </Button>
        ) : (
          <Button size="lg" asChild className="h-14 px-8 text-lg shadow-lg shadow-primary/25">
            <Link to="/pricing">
              <Lock className="w-5 h-5 mr-2" />
              Upgrade to Pro to Access
            </Link>
          </Button>
        )}
        <Button variant="outline" size="lg" asChild className="h-14 px-8 text-lg">
          <Link to="/pricing">View Plans</Link>
        </Button>
      </div>

      {!hasCredits && (
        <p className="text-sm text-muted-foreground">
          You've used your free trial scrape. Upgrade to Investor Pro for unlimited access.
        </p>
      )}
    </div>
  </div>
);

export default function Scraper() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  // New Filter State
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('any');
  const [maxDaysOnMarket, setMaxDaysOnMarket] = useState('');

  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [sources, setSources] = useState<SourceBreakdown | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const { scrapeCredits, planTier, refreshSubscription, isLoading } = useSubscription(); // Assuming isLoading added to hook return
  const { role } = useAuth();
  const [isLanding, setIsLanding] = useState(true);

  const { openDealAnalyzer } = useDealAnalyzerStore();

  const navigate = useNavigate();

  // Determine view mode on load
  useEffect(() => {
    if (!isLoading) {
      if (planTier === 'pro') {
        setIsLanding(false); // Pro users go straight to tool
      } else {
        setIsLanding(true); // Non-pro see landing first
      }
    }
  }, [planTier, isLoading]);

  const handleTryFree = () => {
    if (scrapeCredits > 0) {
      setIsLanding(false);
    } else {
      toast.error("No free credits remaining. Please upgrade to Pro.");
      navigate('/pricing');
    }
  };


  // Run audit pipeline when results change
  useEffect(() => {
    const runAudit = async () => {
      if (results.length === 0) {
        setAuditReport(null);
        return;
      }

      setIsAuditing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Convert results to ScrapedDeal shape for audit
        const deals: ScrapedDeal[] = results.map(r => ({
          title: r.title,
          price: r.price,
          location: r.location,
          source: r.source as ScrapedDeal['source'],
          link: r.link,
          description: r.description,
          ai_score: r.ai_score,
          reasoning: r.reasoning,
          address: r.address,
          city: r.city,
          state: r.state,
          zip_code: r.zip_code,
          asking_price: r.price,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          sqft: r.sqft,
          property_type: r.property_type as ScrapedDeal['property_type'],
          condition: r.condition as ScrapedDeal['condition'],
          arv: r.metrics?.arv,
          equity_percentage: r.metrics?.equityPercentage,
        }));

        // TODO: Fetch user buy boxes for relevance check
        const report = await auditScrapedDeals(deals, [], user.id);
        setAuditReport(report);
        console.log('[SCRAPER] Audit report:', report);
      } catch (err) {
        console.error('[SCRAPER] Audit failed:', err);
      } finally {
        setIsAuditing(false);
      }
    };
    runAudit();
  }, [results]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow free trial users (planTier !== 'pro' but has credits)
    // if (planTier !== 'pro') { ... } -> Removed blocker

    // Check credits
    if (scrapeCredits <= 0) {
      toast.error(planTier === 'pro'
        ? 'No scrape credits remaining this month'
        : 'Free trial used. Please upgrade to Pro.');
      return;
    }

    if (!city || !state) {
      toast.error('Please enter city and state');
      return;
    }

    setIsScraping(true);
    setResults([]);
    setAuditReport(null);
    setSources(null);

    try {
      // 1. Fire both scrapers concurrently
      const [aiHunterResponse, liveMarketResponse] = await Promise.all([
        supabase.functions.invoke('ai-hunter', {
          body: {
            city,
            state,
            min_price: minPrice ? Number(minPrice) : undefined,
            max_price: maxPrice ? Number(maxPrice) : undefined,
            property_type: propertyType !== 'any' ? propertyType : undefined,
            max_days_on_market: maxDaysOnMarket ? Number(maxDaysOnMarket) : undefined
          }
        }),
        supabase.functions.invoke('live-market-deals', {
          body: {
            location: `${city}, ${state}`,
            max_price: maxPrice ? Number(maxPrice) : undefined,
            min_beds: undefined,
            max_dom: maxDaysOnMarket ? Number(maxDaysOnMarket) : undefined,
          }
        })
      ]);

      if (aiHunterResponse.error) console.error("AI Hunter Error:", aiHunterResponse.error);
      if (liveMarketResponse.error) console.error("Live Deals Error:", liveMarketResponse.error);

      let rawDeals = aiHunterResponse.data?.deals || [];
      const liveDeals = liveMarketResponse.data || [];
      if (liveDeals && liveDeals.length > 0) {
        const mappedLive = liveDeals.map((d: any) => ({
          title: d.address,
          address: d.address,
          city: city,
          state: state,
          price: parseInt(d.list_price?.toString().replace(/[^0-9]/g, '')) || 0,
          source: "Live API",
          link: d.url,
          description: `Days on Market: ${d.dom}`,
          property_type: propertyType !== 'any' ? propertyType : 'single_family',
          condition: 'fair',
          integrity: d.data_integrity,
        }));

        rawDeals = [...mappedLive, ...rawDeals];
      }

      // 3. Underwrite everything through the Single Source of Truth math engine
      if (rawDeals.length > 0) {
        const enrichedDeals = rawDeals.map((deal: any) => {
          const input: DealInput = {
            title: deal.title || 'Untitled',
            address: deal.address || 'Unknown',
            city: deal.city || '',
            state: deal.state || '',
            zip_code: deal.zip_code || '',
            property_type: deal.property_type || 'single_family',
            deal_type: 'wholesale',
            condition: deal.condition || 'fair',
            asking_price: deal.price || 0,
            arv: deal.metrics?.arv || deal.arv,
            repair_estimate: deal.metrics?.repair_estimate || deal.repair_estimate,
            assignment_fee: 0,
            bedrooms: deal.bedrooms,
            bathrooms: deal.bathrooms,
            sqft: deal.sqft
          };

          const metrics = calculateDealMetrics(input);

          return {
            ...deal,
            ai_score: metrics ? metrics.score : 0,
            metrics: metrics,
            integrity: deal.integrity,
            reasoning: metrics
              ? `Math Verified: ${metrics.equityPercentage.toFixed(1)}% equity. MAO: $${Math.round(metrics.mao).toLocaleString()}. ROI: ${metrics.roi.toFixed(1)}%.`
              : deal.reasoning || "Insufficient data for calculation."
          };
        });

        setResults(enrichedDeals);
        setSources(aiHunterResponse.data?.sources || null);
        toast.success(`Found ${enrichedDeals.length} potential deals!`);
        await refreshSubscription();
      } else {
        toast.info('No deals found in this location currently.');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error('Failed to hunt for deals. Please try again.');
    } finally {
      setIsScraping(false);
    }
  };

  if (isLanding) {
    return (
      <MainLayout>
        <ScraperLanding onTryFree={handleTryFree} hasCredits={scrapeCredits > 0} />
      </MainLayout>
    );
  }

  const handleOpenDetailCallback = (deal: ScrapeResult) => {
    const compatibleDeal: DealDetail = {
      ...deal,
      image: undefined,
    };
    openDealAnalyzer('deal', compatibleDeal);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                AI Hunter Engine
              </h1>
              <p className="text-muted-foreground mt-2">
                Scan real MLS listings & FSBO sources — validated by our Calculator Agent
              </p>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 px-6">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-primary">Scrape Credits</span>
                  {role === 'admin' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-primary">Unlimited</span>
                      <Badge variant="secondary" className="mt-1 text-xs">Admin</Badge>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{scrapeCredits}</span>
                      <span className="text-xs text-muted-foreground mt-1">Remaining this month</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Control Panel */}
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl">Search Parameters</CardTitle>
                  <CardDescription>Target a specific market</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleScrape} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g. Atlanta"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={isScraping}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State (Abbr)</Label>
                      <Input
                        id="state"
                        placeholder="e.g. GA"
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        disabled={isScraping}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price Range</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Min Price"
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          disabled={isScraping}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          placeholder="Max Price"
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          disabled={isScraping}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <select
                        id="propertyType"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        disabled={isScraping}
                      >
                        <option value="any">Any Type</option>
                        <option value="single_family">Single Family</option>
                        <option value="multi_family">Multi-Family</option>
                        <option value="condo">Condo / Townhouse</option>
                        <option value="land">Land</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dom">Max Days on Market</Label>
                      <Input
                        id="dom"
                        placeholder="e.g. 30 (Leave empty for any)"
                        type="number"
                        value={maxDaysOnMarket}
                        onChange={(e) => setMaxDaysOnMarket(e.target.value)}
                        disabled={isScraping}
                      />
                    </div>

                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-3">Data Sources</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>MLS Listings (Realtor.com)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Craigslist (For Sale by Owner)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Calculator Agent Validation</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isScraping || !city || !state || planTier !== 'pro'}
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Hunting Deals...
                        </>
                      ) : (
                        <>
                          <Scan className="mr-2 h-4 w-4" />
                          Start Hunt
                        </>
                      )}
                    </Button>

                    {planTier !== 'pro' && (
                      <div className="mt-3 p-2 bg-primary/10 rounded text-center">
                        <p className="text-xs font-medium text-primary">
                          ✨ Using Free Trial Credit
                        </p>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="md:col-span-2">
              {!isScraping && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium">No Hunted Deals Yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-2 px-6">
                    Enter a location and start the hunt. Real MLS listings and FSBO deals, validated by our Calculator Agent.
                  </p>
                </div>
              ) : isScraping ? (
                <div className="space-y-6">
                  <div className="p-8 text-center animate-pulse bg-muted rounded-xl">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-medium">Scanning Real Listings...</h3>
                    <p className="text-muted-foreground mt-2">Checking MLS, FSBO sources, and running Calculator Agent validation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Source breakdown + Audit summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    {/* Source Breakdown */}
                    {sources && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="py-4 px-5">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">Sources</span>
                          </div>
                          <div className="flex gap-3 text-sm">
                            {sources.mls > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Globe className="h-3 w-3" /> MLS: {sources.mls}
                              </Badge>
                            )}
                            {sources.fsbo > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Search className="h-3 w-3" /> FSBO: {sources.fsbo}
                              </Badge>
                            )}
                            {sources.fallback > 0 && (
                              <Badge variant="outline" className="gap-1 border-amber-300">
                                <BrainCircuit className="h-3 w-3" /> AI: {sources.fallback}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Audit Summary */}
                    {auditReport && (
                      <Card className={`border ${auditReport.pass ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <CardContent className="py-4 px-5">
                          <div className="flex items-center gap-2 mb-2">
                            {auditReport.pass ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-sm font-bold">
                              Audit: {auditReport.overallScore}/100
                            </span>
                            <Badge
                              className={`ml-auto ${auditReport.pass ? 'bg-emerald-600' : 'bg-amber-600'}`}
                            >
                              {auditReport.pass ? 'PASS' : 'REVIEW'}
                            </Badge>

                            <Button variant="ghost" size="sm" className="h-6 text-xs ml-2" onClick={() => auditReport && openDealAnalyzer('audit', auditReport)}>
                              Review Full Report
                            </Button>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{auditReport.alerts.filter(a => a.severity === 'critical').length} critical</span>
                            <span>·</span>
                            <span>{auditReport.alerts.filter(a => a.severity === 'warning').length} warnings</span>
                            <span>·</span>
                            <span>{results.filter(r => r.validated).length}/{results.length} validated</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {isAuditing && !auditReport && (
                      <Card className="bg-muted/50">
                        <CardContent className="py-4 px-5 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Running audit pipeline...</span>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">Hunt Results</h2>
                    <Badge variant="outline">{results.length} Deals Found</Badge>
                  </div>

                  {results.map((result, idx) => (
                    <Card key={idx} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
                      <div className="p-6">
                        {/* Header row */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {result.source}
                              </Badge>
                              {result.validated ? (
                                <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> Validated
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
                                  <AlertCircle className="h-3 w-3" /> Unvalidated
                                </Badge>
                              )}
                              {getAuditBadge(idx, auditReport, () => auditReport && openDealAnalyzer('audit', auditReport))}
                            </div>
                            <CardTitle className="text-lg">{result.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {result.location}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-primary">
                              {formatCurrency(result.price)}
                            </div>
                          </div>
                        </div>

                        {/* Calculator Agent Metrics */}
                        {result.metrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground font-medium">MAO</div>
                              <div className="text-sm font-bold">{formatCurrency(result.metrics.mao)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground font-medium">Equity</div>
                              <div className={`text-sm font-bold ${result.metrics.equityPercentage > 20 ? 'text-emerald-600' : result.metrics.equityPercentage > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {result.metrics.equityPercentage.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground font-medium">ROI</div>
                              <div className={`text-sm font-bold ${result.metrics.roi > 15 ? 'text-emerald-600' : result.metrics.roi > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {result.metrics.roi.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground font-medium">Deal Score</div>
                              <div className={`text-sm font-bold ${result.metrics.score >= 70 ? 'text-emerald-600' : result.metrics.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                {result.metrics.score}/100
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AI Score & Reasoning */}
                        <div className="bg-success/5 border border-success/20 rounded-lg p-3 mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="text-sm font-bold text-success">AI Score: {result.ai_score}/100</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {result.reasoning}
                          </p>
                        </div>

                        {/* Risk factors */}
                        {result.metrics?.riskFactors && result.metrics.riskFactors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {result.metrics.riskFactors.map((risk, i) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                <AlertTriangle className="h-3 w-3" />
                                {risk}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                          {result.link && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={result.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Listing
                              </a>
                            </Button>
                          )}
                          <Button size="sm" onClick={() => handleOpenDetailCallback(result)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Detailed Analysis
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <DealAnalyzerModal />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
