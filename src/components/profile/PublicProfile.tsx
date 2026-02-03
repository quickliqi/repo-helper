import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EnhancedPropertyCard } from '@/components/marketplace/EnhancedPropertyCard';
import { Property } from '@/types/database';
import { 
  Shield, 
  MapPin, 
  Building2, 
  Star, 
  Calendar,
  MessageSquare,
  Loader2,
  User,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PublicProfileData {
  user_id: string;
  full_name: string;
  company_name?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  state?: string;
  is_verified: boolean;
  deals_closed: number;
  member_since?: string;
  response_rate?: number;
  avg_response_time_hours?: number;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as PublicProfileData);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      setRole(roleData?.role || null);

      // Fetch listings if wholesaler
      if (roleData?.role === 'wholesaler') {
        const { data: listingsData } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);
        setListings((listingsData as Property[]) || []);
      }

      // Fetch ratings
      const { data: avgData } = await supabase.rpc('get_user_avg_rating', { p_user_id: userId });
      const { data: countData } = await supabase.rpc('get_user_rating_count', { p_user_id: userId });
      setAvgRating(Number(avgData) || 0);
      setRatingCount(Number(countData) || 0);

    } catch (error) {
      console.error('Error fetching profile:', error);
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

  if (!profile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This user profile doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
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
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {profile.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="font-display text-3xl font-bold text-foreground">
                    {profile.full_name}
                  </h1>
                  {profile.is_verified && (
                    <Badge className="gap-1 bg-green-600 text-white">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                {profile.company_name && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>{profile.company_name}</span>
                  </div>
                )}

                {(profile.city || profile.state) && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[profile.city, profile.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {role}
                  </Badge>
                  {profile.member_since && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {new Date(profile.member_since).getFullYear()}
                    </Badge>
                  )}
                </div>
              </div>

              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        </div>

        {/* Stats & Bio */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
                  </span>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= avgRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Deals Closed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">{profile.deals_closed || 0}</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Successful transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">
                  {profile.response_rate ? `${profile.response_rate}%` : 'N/A'}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.avg_response_time_hours 
                    ? `Usually responds within ${profile.avg_response_time_hours}h`
                    : 'Response time not available'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bio */}
          {profile.bio && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Listings for Wholesalers */}
          {role === 'wholesaler' && listings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Active Listings</h2>
                <Button variant="outline" asChild>
                  <Link to={`/marketplace?seller=${userId}`}>View All</Link>
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((property) => (
                  <EnhancedPropertyCard 
                    key={property.id} 
                    property={property}
                    showSeller={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}