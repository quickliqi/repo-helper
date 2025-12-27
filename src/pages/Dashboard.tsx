import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Property, Match, BuyBox } from '@/types/database';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { 
  TrendingUp, 
  Building2, 
  Bell, 
  Plus, 
  ArrowRight,
  Target,
  Eye,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile, role } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyBoxes, setBuyBoxes] = useState<BuyBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (role === 'investor') {
        // Fetch matches with property data
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('investor_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(6);
        
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
          setMatches(matchesWithProps as Match[]);
        }

        // Fetch buy boxes
        const { data: bbData } = await supabase
          .from('buy_boxes')
          .select('*')
          .eq('user_id', user?.id);
        setBuyBoxes((bbData as BuyBox[]) || []);
      } else if (role === 'wholesaler') {
        // Fetch my listings
        const { data: propData } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(6);
        setProperties((propData as Property[]) || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground capitalize">
              {role} Dashboard
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {role === 'investor' ? (
            // Investor Dashboard
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Buy Boxes</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{buyBoxes.filter(b => b.is_active).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">New Matches</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{matches.filter(m => !m.is_viewed).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{matches.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <Button asChild>
                  <Link to="/buy-box">
                    <Plus className="h-4 w-4 mr-2" />
                    {buyBoxes.length === 0 ? 'Create Buy Box' : 'Manage Buy Box'}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>

              {/* Recent Matches */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold">Recent Matches</h2>
                  {matches.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/matches">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  )}
                </div>
                {matches.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No matches yet. Create a buy box to start receiving matched deals.</p>
                      <Button asChild>
                        <Link to="/buy-box">Create Buy Box</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.slice(0, 3).map((match) => (
                      match.property && <PropertyCard key={match.id} property={match.property} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Wholesaler Dashboard
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.filter(p => p.status === 'active').length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.reduce((acc, p) => acc + p.views_count, 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <Button asChild>
                  <Link to="/post-deal">
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Deal
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/buyer-demand">View Buyer Demand</Link>
                </Button>
              </div>

              {/* My Listings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold">My Listings</h2>
                  {properties.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/my-listings">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  )}
                </div>
                {properties.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No listings yet. Post your first deal to start connecting with investors.</p>
                      <Button asChild>
                        <Link to="/post-deal">Post a Deal</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.slice(0, 3).map((property) => (
                      <PropertyCard key={property.id} property={property} showActions={false} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}