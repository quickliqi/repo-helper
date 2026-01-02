import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Property, Match } from '@/types/database';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { UpgradePrompt } from '@/components/subscription/SubscriptionGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Star,
  Eye,
  Loader2,
  Target,
  ArrowRight
} from 'lucide-react';

export default function Matches() {
  const { user } = useAuth();
  const { isSubscribed, isTrialing } = useSubscription();
  const hasAccess = isSubscribed || isTrialing;
  const [matches, setMatches] = useState<(Match & { property?: Property })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user && hasAccess) {
      fetchMatches();
    } else {
      setIsLoading(false);
    }
  }, [user, hasAccess]);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('*')
        .eq('investor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (matchData && matchData.length > 0) {
        const propertyIds = matchData.map(m => m.property_id);
        const { data: propData } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds);

        const matchesWithProps = matchData.map(m => ({
          ...m,
          property: propData?.find(p => p.id === m.property_id)
        }));
        setMatches(matchesWithProps as (Match & { property?: Property })[]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsViewed = async (matchId: string) => {
    await supabase
      .from('matches')
      .update({ is_viewed: true })
      .eq('id', matchId);
  };

  const toggleSaved = async (matchId: string, currentState: boolean) => {
    await supabase
      .from('matches')
      .update({ is_saved: !currentState })
      .eq('id', matchId);
    
    setMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, is_saved: !currentState } : m
    ));
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'saved') return match.is_saved;
    if (activeTab === 'new') return !match.is_viewed;
    return true;
  });

  const newCount = matches.filter(m => !m.is_viewed).length;
  const savedCount = matches.filter(m => m.is_saved).length;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return (
      <MainLayout>
        <div className="bg-background min-h-screen">
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                My Matches
              </h1>
              <p className="text-muted-foreground">
                Properties matched to your buy box criteria
              </p>
            </div>
          </div>
          <div className="container mx-auto px-4 py-12">
            <UpgradePrompt type="investor" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  My Matches
                </h1>
                <p className="text-muted-foreground">
                  Properties matched to your buy box criteria—delivered to you automatically
                </p>
              </div>
              <Button asChild>
                <Link to="/buy-box">
                  <Target className="h-4 w-4 mr-2" />
                  Manage Buy Box
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <TrendingUp className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No matches yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create or refine your buy box criteria to start receiving matched properties automatically.
              </p>
              <Button asChild>
                <Link to="/buy-box">
                  Create Buy Box
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">
                    All Matches
                    <Badge variant="secondary" className="ml-2">{matches.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="new">
                    <Eye className="h-4 w-4 mr-1" />
                    New
                    {newCount > 0 && <Badge className="ml-2 bg-accent text-accent-foreground">{newCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="saved">
                    <Star className="h-4 w-4 mr-1" />
                    Saved
                    {savedCount > 0 && <Badge variant="secondary" className="ml-2">{savedCount}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Results */}
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {activeTab === 'saved' 
                      ? 'No saved matches. Star a match to save it for later.'
                      : 'No new matches. Check back soon or browse the marketplace.'}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match) => (
                    match.property && (
                      <div key={match.id} className="relative">
                        {/* Match Score Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-accent text-accent-foreground shadow-lg">
                            {match.match_score}% Match
                          </Badge>
                        </div>
                        {/* Save Button */}
                        <button
                          onClick={() => toggleSaved(match.id, match.is_saved || false)}
                          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
                        >
                          <Star 
                            className={`h-5 w-5 ${match.is_saved ? 'fill-accent text-accent' : 'text-muted-foreground'}`} 
                          />
                        </button>
                        <div onClick={() => markAsViewed(match.id)}>
                          <PropertyCard property={match.property} />
                        </div>
                        {!match.is_viewed && (
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="default" className="bg-success text-success-foreground">
                              New
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}