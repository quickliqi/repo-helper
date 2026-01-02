import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Building2, 
  Plus,
  Eye,
  Loader2,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export default function MyListings() {
  const { user } = useAuth();
  const { listingCredits } = useSubscription();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data as Property[]) || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (propertyId: string, newStatus: Property['status']) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;
      
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, status: newStatus } : p
      ));
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredProperties = properties.filter(prop => {
    if (activeTab === 'active') return prop.status === 'active';
    if (activeTab === 'pending') return prop.status === 'pending' || prop.status === 'under_contract';
    if (activeTab === 'closed') return prop.status === 'sold' || prop.status === 'withdrawn';
    return true;
  });

  const activeCount = properties.filter(p => p.status === 'active').length;
  const pendingCount = properties.filter(p => p.status === 'pending' || p.status === 'under_contract').length;
  const closedCount = properties.filter(p => p.status === 'sold' || p.status === 'withdrawn').length;
  const totalViews = properties.reduce((acc, p) => acc + (p.views_count || 0), 0);

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  My Listings
                </h1>
                <p className="text-muted-foreground">
                  Manage your wholesale deals and track investor interest
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                  <CreditCard className="h-4 w-4 mr-1" />
                  {listingCredits} credit{listingCredits !== 1 ? 's' : ''}
                </Badge>
                {listingCredits > 0 ? (
                  <Button asChild>
                    <Link to="/post-deal">
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Deal
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary">
                    <Link to="/pricing">
                      Buy Credits
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Total Listings</span>
                </div>
                <p className="text-2xl font-bold">{properties.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-success">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 text-accent" />
                  <span className="text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-accent">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Total Views</span>
                </div>
                <p className="text-2xl font-bold">{totalViews}</p>
              </CardContent>
            </Card>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No listings yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Post your first wholesale deal to start connecting with qualified cash buyers.
              </p>
              <Button asChild>
                <Link to="/post-deal">
                  Post Your First Deal
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
                    All
                    <Badge variant="secondary" className="ml-2">{properties.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    <CheckCircle className="h-4 w-4 mr-1 text-success" />
                    Active
                    {activeCount > 0 && <Badge className="ml-2 bg-success text-success-foreground">{activeCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    <Clock className="h-4 w-4 mr-1 text-accent" />
                    Pending
                    {pendingCount > 0 && <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="closed">
                    <XCircle className="h-4 w-4 mr-1" />
                    Closed
                    {closedCount > 0 && <Badge variant="secondary" className="ml-2">{closedCount}</Badge>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Listings */}
              {filteredProperties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No {activeTab !== 'all' ? activeTab : ''} listings found.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="relative">
                      <PropertyCard property={property} showActions={false} />
                      {/* Status Selector */}
                      <div className="absolute bottom-3 left-3 right-3 z-10">
                        <Select 
                          value={property.status || 'active'} 
                          onValueChange={(value) => updateStatus(property.id, value as Property['status'])}
                        >
                          <SelectTrigger className="bg-white/95 shadow-lg text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="under_contract">Under Contract</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Views Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="secondary" className="bg-white/90 shadow">
                          <Eye className="h-3 w-3 mr-1" />
                          {property.views_count || 0} views
                        </Badge>
                      </div>
                    </div>
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