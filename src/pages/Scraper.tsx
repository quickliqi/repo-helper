import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useScrapeSubscription } from '@/hooks/useScrapeSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Zap, Target, TrendingUp, Lock, ExternalLink, CheckCircle, AlertCircle, Bookmark, BookmarkCheck, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams, Navigate } from 'react-router-dom';

interface ScrapedDeal {
  id?: string; // From database
  address: string;
  city: string;
  state: string;
  zip_code: string;
  asking_price: number;
  arv: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  condition: string;
  property_type: string;
  deal_type: string;
  repair_estimate: number;
  equity_percentage: number;
  description: string;
  match_score: number;
  confidence_score: number;
  analysis_notes: string;
  is_saved?: boolean;
}

export default function Scraper() {
  const { user, role } = useAuth();
  const { isSubscribed, creditsRemaining, creditsUsed, periodEnd, isLoading: subLoading, refreshScrapeSubscription } = useScrapeSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScrapedDeal[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [savingDeals, setSavingDeals] = useState<Set<string>>(new Set());
  const [convertingDeals, setConvertingDeals] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Redirect non-investors
  if (role && role !== 'investor') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check for success/cancel from checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: "Subscription Activated!",
        description: "You now have 10 scrape credits. Start finding deals!",
      });
      refreshScrapeSubscription();
    } else if (canceled === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "You can subscribe anytime to access the scraper.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, refreshScrapeSubscription]);

  const handleSubscribe = async () => {
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-subscription-checkout');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || error?.error || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a Facebook URL to scrape",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-facebook-deals', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data?.success) {
        setResults(data.deals || []);
        toast({
          title: "Scan Complete!",
          description: `Found ${data.deals_found} high-confidence deals. ${data.credits_remaining} credits remaining.`,
        });
        refreshScrapeSubscription();
      } else {
        throw new Error(data?.error || "Scan failed");
      }
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan URL",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveDeal = async (dealId: string, index: number) => {
    setSavingDeals(prev => new Set(prev).add(dealId || String(index)));
    
    try {
      const { data, error } = await supabase.functions.invoke('save-scraped-deal', {
        body: { scrape_result_id: dealId }
      });

      if (error) throw error;

      if (data?.success) {
        // Update the results to mark as saved
        setResults(prev => prev.map((deal, i) => 
          i === index ? { ...deal, is_saved: true } : deal
        ));
        toast({
          title: "Deal Saved!",
          description: "This deal has been saved to your collection.",
        });
      } else {
        throw new Error(data?.error || "Failed to save deal");
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save deal",
        variant: "destructive",
      });
    } finally {
      setSavingDeals(prev => {
        const newSet = new Set(prev);
        newSet.delete(dealId || String(index));
        return newSet;
      });
    }
  };

  const handleConvertToListing = async (dealId: string, deal: ScrapedDeal) => {
    setConvertingDeals(prev => new Set(prev).add(dealId));
    
    try {
      const { data, error } = await supabase.functions.invoke('convert-scrape-to-listing', {
        body: { 
          scrape_result_id: dealId,
          overrides: {
            title: `${deal.bedrooms} Bed ${deal.property_type?.replace(/_/g, ' ')} in ${deal.city}`,
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Listing Created!",
          description: "Deal has been converted to a marketplace listing.",
        });
        // Navigate to the new listing
        navigate(`/marketplace`);
      } else {
        throw new Error(data?.error || "Failed to convert deal");
      }
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert deal to listing",
        variant: "destructive",
      });
    } finally {
      setConvertingDeals(prev => {
        const newSet = new Set(prev);
        newSet.delete(dealId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500/10 text-green-500',
      good: 'bg-blue-500/10 text-blue-500',
      fair: 'bg-yellow-500/10 text-yellow-500',
      poor: 'bg-orange-500/10 text-orange-500',
      distressed: 'bg-red-500/10 text-red-500',
    };
    return colors[condition] || 'bg-muted text-muted-foreground';
  };

  if (subLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>AI Deal Scraper | DealMatch</title>
        <meta name="description" content="Scrape Facebook for off-market real estate deals matching your buy box criteria with AI-powered analysis" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Deal Scraper</h1>
          <p className="text-muted-foreground">
            Scrape Facebook Marketplace and groups to find deals matching your buy box criteria
          </p>
        </div>

        {!isSubscribed ? (
          // Upgrade prompt
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Unlock AI Deal Scraping</CardTitle>
              <CardDescription className="text-base max-w-md mx-auto">
                Subscribe to Investor Scraping Pro for $100/month and get 10 AI-powered scrape sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Smart Scraping</h3>
                    <p className="text-sm text-muted-foreground">Extract deals from any Facebook URL</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Buy Box Matching</h3>
                    <p className="text-sm text-muted-foreground">Auto-match to your criteria</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">85%+ Confidence</h3>
                    <p className="text-sm text-muted-foreground">Only high-accuracy deals</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleSubscribe}
                  disabled={isCheckingOut}
                  className="px-8"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe for $100/month
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Scraper interface
          <div className="space-y-6">
            {/* Credits display */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">Scrape Credits:</span>
                      <Badge variant={creditsRemaining > 0 ? "default" : "destructive"}>
                        {creditsRemaining} remaining
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ({creditsUsed} used this month)
                    </span>
                  </div>
                  {periodEnd && (
                    <span className="text-sm text-muted-foreground">
                      Resets: {new Date(periodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scrape input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Scrape Facebook URL
                </CardTitle>
                <CardDescription>
                  Paste a Facebook Marketplace or real estate group URL to scan for deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://facebook.com/marketplace/item/... or group URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={isScanning || creditsRemaining <= 0}
                  />
                  <Button 
                    onClick={handleScrape}
                    disabled={isScanning || creditsRemaining <= 0 || !url.trim()}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Scan for Deals
                      </>
                    )}
                  </Button>
                </div>
                {creditsRemaining <= 0 && (
                  <p className="text-sm text-destructive mt-2">
                    No credits remaining. Credits reset at the start of your next billing cycle.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Found {results.length} High-Confidence Deals
                </h2>
                <div className="grid gap-4">
                  {results.map((deal, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {deal.address}
                            </h3>
                            <p className="text-muted-foreground">
                              {deal.city}, {deal.state} {deal.zip_code}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500/10 text-green-500">
                              {deal.confidence_score}% Confidence
                            </Badge>
                            <Badge className="bg-primary/10 text-primary">
                              {deal.match_score}% Match
                            </Badge>
                            {deal.id && !deal.is_saved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveDeal(deal.id!, index)}
                                disabled={savingDeals.has(deal.id || String(index))}
                              >
                                {savingDeals.has(deal.id || String(index)) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Bookmark className="h-4 w-4 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                            )}
                            {deal.id && deal.is_saved && (
                              <>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <BookmarkCheck className="h-3 w-3" />
                                  Saved
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleConvertToListing(deal.id!, deal)}
                                  disabled={convertingDeals.has(deal.id)}
                                >
                                  {convertingDeals.has(deal.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ArrowRightCircle className="h-4 w-4 mr-1" />
                                      Post to Marketplace
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Asking Price</p>
                            <p className="text-xl font-bold">{formatCurrency(deal.asking_price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ARV</p>
                            <p className="text-xl font-bold text-green-500">{formatCurrency(deal.arv)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Equity</p>
                            <p className="text-xl font-bold">{deal.equity_percentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Repair Est.</p>
                            <p className="text-xl font-bold">{formatCurrency(deal.repair_estimate)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">
                            {deal.bedrooms} bed / {deal.bathrooms} bath
                          </Badge>
                          <Badge variant="outline">
                            {deal.sqft?.toLocaleString()} sqft
                          </Badge>
                          <Badge className={getConditionColor(deal.condition)}>
                            {deal.condition}
                          </Badge>
                          <Badge variant="secondary">
                            {deal.property_type?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="secondary">
                            {deal.deal_type?.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {deal.analysis_notes && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                              <span>{deal.analysis_notes}</span>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state after scan */}
            {!isScanning && results.length === 0 && url && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Deals Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    The AI couldn't find deals meeting the 85% confidence threshold on this page. 
                    Try a different URL or check if it contains property listings.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
