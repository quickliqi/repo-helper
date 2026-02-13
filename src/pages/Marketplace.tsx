import { useEffect, useState, useCallback, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EnhancedPropertyCard } from '@/components/marketplace/EnhancedPropertyCard';
import { AdvancedFilters, FilterState } from '@/components/marketplace/AdvancedFilters';
import { SaveSearchDialog } from '@/components/marketplace/SaveSearchDialog';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Property, PropertyType, DealType, PropertyCondition } from '@/types/database';
import { Loader2, LayoutGrid, List, Heart } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';
import { MarketplaceGate } from '@/components/marketplace/MarketplaceGate';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface SellerInfo {
  user_id: string;
  full_name: string;
  company_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  deals_closed: number;
  member_since?: string;
}

function MarketplaceContent() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellerInfoMap, setSellerInfoMap] = useState<Record<string, SellerInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    propertyTypes: [],
    dealTypes: [],
    conditions: [],
    states: [],
    minPrice: null,
    maxPrice: null,
    minEquity: null,
    sortBy: 'newest',
  });

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
      const propertiesData = (data as Property[]) || [];
      setProperties(propertiesData);

      // Fetch seller info for all unique user_ids
      const uniqueUserIds = [...new Set(propertiesData.map(p => p.user_id))];
      if (uniqueUserIds.length > 0) {
        const { data: sellersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, company_name, avatar_url, is_verified, deals_closed, member_since')
          .in('user_id', uniqueUserIds);

        if (sellersData) {
          const map: Record<string, SellerInfo> = {};
          sellersData.forEach((seller: SellerInfo) => {
            map[seller.user_id] = seller;
          });
          setSellerInfoMap(map);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchProperties();
  }, []);

  const filteredAndSortedProperties = useMemo(() => {
    const result = properties.filter((property) => {
      // Search query
      const matchesSearch = !filters.searchQuery ||
        property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        property.state.toLowerCase().includes(filters.searchQuery.toLowerCase());

      // Property types
      const matchesType = filters.propertyTypes.length === 0 ||
        filters.propertyTypes.includes(property.property_type as PropertyType);

      // Deal types
      const matchesDeal = filters.dealTypes.length === 0 ||
        filters.dealTypes.includes(property.deal_type as DealType);

      // Conditions
      const matchesCondition = filters.conditions.length === 0 ||
        filters.conditions.includes(property.condition as PropertyCondition);

      // States
      const matchesState = filters.states.length === 0 ||
        filters.states.includes(property.state);

      // Price range
      const matchesMinPrice = !filters.minPrice || property.asking_price >= filters.minPrice;
      const matchesMaxPrice = !filters.maxPrice || property.asking_price <= filters.maxPrice;

      // Equity
      const matchesEquity = !filters.minEquity ||
        (property.equity_percentage && property.equity_percentage >= filters.minEquity);

      return matchesSearch && matchesType && matchesDeal && matchesCondition &&
        matchesState && matchesMinPrice && matchesMaxPrice && matchesEquity;
    });

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => a.asking_price - b.asking_price);
        break;
      case 'price_high':
        result.sort((a, b) => b.asking_price - a.asking_price);
        break;
      case 'equity_high':
        result.sort((a, b) => (b.equity_percentage || 0) - (a.equity_percentage || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [properties, filters]);

  const renderContent = () => (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Deal Marketplace
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Browse active wholesale deals from verified sellers
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link to="/saved">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Saved</span>
                  </Link>
                </Button>
              )}
              <div className="hidden md:flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/50 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSaveSearch={user ? () => setShowSaveDialog(true) : undefined}
            resultCount={filteredAndSortedProperties.length}
          />
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAndSortedProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">
              No properties match your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => setFilters({
                ...filters,
                searchQuery: '',
                propertyTypes: [],
                dealTypes: [],
                conditions: [],
                states: [],
                minPrice: null,
                maxPrice: null,
                minEquity: null,
              })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 md:mb-6">
              Showing {filteredAndSortedProperties.length} {filteredAndSortedProperties.length === 1 ? 'property' : 'properties'}
            </p>
            <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
              }`}>
              {filteredAndSortedProperties.map((property) => (
                <EnhancedPropertyCard
                  key={property.id}
                  property={property}
                  sellerInfo={sellerInfoMap[property.user_id]}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save Search Dialog */}
      <SaveSearchDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        filters={filters}
      />
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