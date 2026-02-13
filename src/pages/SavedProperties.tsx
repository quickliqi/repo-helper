import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EnhancedPropertyCard } from '@/components/marketplace/EnhancedPropertyCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/types/database';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';
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

export default function SavedProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellerInfoMap, setSellerInfoMap] = useState<Record<string, SellerInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchSavedProperties();
    }
  }, [user]);

  const fetchSavedProperties = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get saved property IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        setProperties([]);
        setIsLoading(false);
        return;
      }

      const propertyIds = savedData.map(s => s.property_id);

      // Fetch the actual properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      if (propertiesError) throw propertiesError;

      const props = (propertiesData as Property[]) || [];
      setProperties(props);

      // Fetch seller info
      const uniqueUserIds = [...new Set(props.map(p => p.user_id))];
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
      console.error('Error fetching saved properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchSavedProperties();
  }, [user]);

  const renderContent = () => (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="md:hidden">
              <Link to="/marketplace">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Saved Properties
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              No saved properties yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Browse the marketplace and tap the heart icon to save properties you're interested in.
            </p>
            <Button asChild>
              <Link to="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <EnhancedPropertyCard
                key={property.id}
                property={property}
                sellerInfo={sellerInfoMap[property.user_id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <Helmet>
        <title>Saved Properties | QuickLiqi</title>
        <meta name="description" content="View your saved properties and favorite real estate deals." />
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