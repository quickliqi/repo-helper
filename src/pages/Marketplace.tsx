import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { supabase } from '@/integrations/supabase/client';
import { Property, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, PropertyType, DealType, US_STATES } from '@/types/database';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';
import { MarketplaceGate } from '@/components/marketplace/MarketplaceGate';

function MarketplaceContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [dealType, setDealType] = useState<string>('all');
  const [state, setState] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data as Property[]) || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchProperties();
  }, []);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = propertyType === 'all' || property.property_type === propertyType;
    const matchesDeal = dealType === 'all' || property.deal_type === dealType;
    const matchesState = state === 'all' || property.state === state;

    return matchesSearch && matchesType && matchesDeal && matchesState;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setPropertyType('all');
    setDealType('all');
    setState('all');
  };

  const hasActiveFilters = searchQuery || propertyType !== 'all' || dealType !== 'all' || state !== 'all';

  const renderContent = () => (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Deal Marketplace
          </h1>
          <p className="text-muted-foreground">
            Browse active wholesale deals from verified sellers
          </p>
          {isMobile && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              Pull down to refresh
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/50 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, city, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter toggles */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* Desktop filters */}
              <div className="hidden md:flex gap-2">
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dealType} onValueChange={setDealType}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Deal Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Deals</SelectItem>
                    {Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div className="md:hidden grid grid-cols-2 gap-2 mt-4 animate-fade-in">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dealType} onValueChange={setDealType}>
                <SelectTrigger>
                  <SelectValue placeholder="Deal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deals</SelectItem>
                  {Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'No properties match your filters.' 
                : 'No active properties available yet.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <Helmet>
        <title>Deal Marketplace | QuickLiqi - Real Estate Wholesale Deals</title>
        <meta name="description" content="Browse active real estate wholesale deals. Find fix and flip, buy and hold, and wholesale opportunities from verified wholesalers." />
      </Helmet>

      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {renderContent()}
        </PullToRefresh>
      ) : (
        renderContent()
      )}
    </MainLayout>
  );
}

export default function Marketplace() {
  return (
    <MarketplaceGate>
      <MarketplaceContent />
    </MarketplaceGate>
  );
}
