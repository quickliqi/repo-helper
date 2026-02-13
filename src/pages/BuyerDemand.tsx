import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BuyBox, PropertyType, DealType, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  MapPin,
  DollarSign,
  Home,
  Loader2,
  Search,
  TrendingUp,
  Users,
  Building2,
  ArrowRight
} from 'lucide-react';

export default function BuyerDemand() {
  const { user, role } = useAuth();
  const [buyBoxes, setBuyBoxes] = useState<BuyBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [dealTypeFilter, setDealTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (user && role === 'wholesaler') {
      fetchBuyBoxes();
    } else {
      setIsLoading(false);
    }
  }, [user, role]);

  const fetchBuyBoxes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('buy_boxes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyBoxes((data as BuyBox[]) || []);
    } catch (error) {
      console.error('Error fetching buy boxes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBuyBoxes = buyBoxes.filter(bb => {
    const matchesSearch =
      bb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bb.target_cities?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      bb.target_states?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPropertyType = propertyTypeFilter === 'all' ||
      bb.property_types.includes(propertyTypeFilter as PropertyType);

    const matchesDealType = dealTypeFilter === 'all' ||
      bb.deal_types.includes(dealTypeFilter as DealType);

    return matchesSearch && matchesPropertyType && matchesDealType;
  });

  const formatPrice = (price: number | null) => {
    if (!price) return 'Any';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Stats
  const uniqueLocations = new Set(buyBoxes.flatMap(bb => [...(bb.target_cities || []), ...(bb.target_states || [])]));
  const avgMaxPrice = buyBoxes.reduce((acc, bb) => acc + (bb.max_price || 0), 0) / (buyBoxes.filter(bb => bb.max_price).length || 1);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (role !== 'wholesaler') {
    return (
      <MainLayout>
        <div className="bg-background min-h-screen">
          <div className="container mx-auto px-4 py-20 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Wholesalers Only</h1>
            <p className="text-muted-foreground mb-6">
              This page shows what investors are actively looking for. Switch to a wholesaler account to access this feature.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Buyer Demand
                </h1>
                <p className="text-muted-foreground">
                  See exactly what investors are looking for—source deals that match their criteria
                </p>
              </div>
              <Button asChild>
                <Link to="/post-deal">
                  Post a Matching Deal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Active Buyers</span>
                </div>
                <p className="text-2xl font-bold text-success">{buyBoxes.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Target Markets</span>
                </div>
                <p className="text-2xl font-bold">{uniqueLocations.size}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Avg. Max Budget</span>
                </div>
                <p className="text-2xl font-bold">{formatPrice(avgMaxPrice)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city, state, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dealTypeFilter} onValueChange={setDealTypeFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Deal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                {Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {buyBoxes.length === 0 ? (
            <div className="text-center py-20">
              <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No active buyer demand yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Investors haven't set up their buy boxes yet. Check back soon or browse the marketplace.
              </p>
            </div>
          ) : filteredBuyBoxes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No buy boxes match your filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredBuyBoxes.length} active buy box{filteredBuyBoxes.length !== 1 ? 'es' : ''}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuyBoxes.map((buyBox) => (
                  <Card key={buyBox.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {buyBox.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Looking for deals matching these criteria
                          </CardDescription>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Property Types */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Home className="h-3 w-3" /> Property Types
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {buyBox.property_types.slice(0, 3).map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {PROPERTY_TYPE_LABELS[type]}
                            </Badge>
                          ))}
                          {buyBox.property_types.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{buyBox.property_types.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Deal Types */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Deal Types
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {buyBox.deal_types.slice(0, 3).map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {DEAL_TYPE_LABELS[type]}
                            </Badge>
                          ))}
                          {buyBox.deal_types.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{buyBox.deal_types.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Price Range
                        </p>
                        <p className="font-medium">
                          {formatPrice(buyBox.min_price)} - {formatPrice(buyBox.max_price)}
                        </p>
                      </div>

                      {/* Locations */}
                      {(buyBox.target_cities?.length || buyBox.target_states?.length) ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Target Locations
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {buyBox.target_states?.slice(0, 3).map(state => (
                              <Badge key={state} variant="secondary" className="text-xs">
                                {state}
                              </Badge>
                            ))}
                            {buyBox.target_cities?.slice(0, 2).map(city => (
                              <Badge key={city} variant="outline" className="text-xs">
                                {city}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Preferred Conditions */}
                      {buyBox.preferred_conditions && buyBox.preferred_conditions.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preferred Conditions</p>
                          <div className="flex flex-wrap gap-1">
                            {buyBox.preferred_conditions.map(cond => (
                              <Badge key={cond} variant="outline" className="text-xs capitalize">
                                {CONDITION_LABELS[cond]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}