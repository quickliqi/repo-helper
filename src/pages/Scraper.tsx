import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

interface ScrapeResult {
  title: string;
  price: string;
  location: string;
  source: string;
  description: string;
  link: string;
  ai_score: number;
  reasoning: string;
}

export default function Scraper() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const { scrapeCredits, planTier, refreshSubscription } = useSubscription();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();

    if (planTier !== 'pro') {
      toast.error('AI Hunter Engine requires a Pro subscription');
      return;
    }

    if (scrapeCredits <= 0) {
      toast.error('No scrape credits remaining this month');
      return;
    }

    if (!city || !state) {
      toast.error('Please enter city and state');
      return;
    }

    setIsScraping(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-hunter', {
        body: { city, state }
      });

      if (error) throw error;

      if (data?.deals) {
        setResults(data.deals);
        toast.success(`Found ${data.deals.length} potential deals!`);
        await refreshSubscription();
      } else {
        toast.info('No deals found in this location currenty.');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error('Failed to hunt for deals. Please try again.');
    } finally {
      setIsScraping(false);
    }
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
                Scan multiple sources for off-market deals using Gemini AI
              </p>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 px-6">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-primary">Scrape Credits</span>
                  <span className="text-3xl font-bold">{scrapeCredits}</span>
                  <span className="text-xs text-muted-foreground mt-1">Remaining this month</span>
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

                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-3">Data Sources</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Craigslist (For Sale by Owner)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Public Records (Probate/Title)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>Regional MLS Filtered Lists</span>
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
                      <p className="text-xs text-center text-destructive mt-2">
                        Pro subscription required
                      </p>
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
                    Enter a location and start the hunt to find off-market opportunities analyzed by Gemini AI.
                  </p>
                </div>
              ) : isScraping ? (
                <div className="space-y-6">
                  <div className="p-8 text-center animate-pulse bg-muted rounded-xl">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-medium">Gemini AI is analyzing leads...</h3>
                    <p className="text-muted-foreground mt-2">Connecting to sources and checking equity data</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Hunt Results</h2>
                    <Badge variant="outline">{results.length} Matches Found</Badge>
                  </div>

                  {results.map((result, idx) => (
                    <Card key={idx} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {result.source}
                              </Badge>
                              <CardTitle className="text-xl">{result.title}</CardTitle>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{result.price}</div>
                              <div className="flex items-center text-sm text-muted-foreground justify-end gap-1">
                                <MapPin className="h-3 w-3" />
                                {result.location}
                              </div>
                            </div>
                          </div>

                          <div className="bg-success/5 border border-success/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-success" />
                              <span className="text-sm font-bold text-success">AI Score: {result.ai_score}/100</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {result.reasoning}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-4">
                            <Button variant="outline" size="sm" asChild>
                              <a href={result.link} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4 mr-2" />
                                View Source
                              </a>
                            </Button>
                            <Button size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Detailed Analysis
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
