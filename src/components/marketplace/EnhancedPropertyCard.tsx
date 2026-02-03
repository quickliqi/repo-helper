import { useState, useEffect } from 'react';
import { Property, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS, STATUS_LABELS } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  MapPin, 
  Home, 
  TrendingUp, 
  Eye,
  Heart,
  ExternalLink,
  Star,
  Shield,
  Clock,
  Bed,
  Bath,
  Square,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SellerInfo {
  full_name: string;
  company_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  deals_closed: number;
  member_since?: string;
}

interface EnhancedPropertyCardProps {
  property: Property;
  sellerInfo?: SellerInfo;
  showSeller?: boolean;
}

export function EnhancedPropertyCard({ property, sellerInfo, showSeller = true }: EnhancedPropertyCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, property.id]);

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', property.id)
      .maybeSingle();
    setIsSaved(!!data);
  };

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to save properties');
      return;
    }

    setIsLoadingSave(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id);
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        await supabase
          .from('saved_properties')
          .insert({ user_id: user.id, property_id: property.id });
        setIsSaved(true);
        toast.success('Property saved!');
      }
    } catch {
      toast.error('Failed to update saved properties');
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/property/${property.id}`;
    if (navigator.share) {
      await navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'under_contract': return 'bg-amber-500 text-white';
      case 'pending': return 'bg-blue-500 text-white';
      case 'sold': return 'bg-gray-500 text-white';
      case 'withdrawn': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const images = property.image_urls || [];
  const hasMultipleImages = images.length > 1;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-border/50 bg-card">
        {/* Image Section */}
        <div 
          className="relative h-52 md:h-48 bg-muted overflow-hidden"
          onMouseEnter={() => hasMultipleImages && setImageIndex(1)}
          onMouseLeave={() => setImageIndex(0)}
        >
          {images.length > 0 ? (
            <img 
              src={images[imageIndex] || images[0]} 
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Home className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Status badge */}
          <Badge className={`absolute top-3 left-3 ${getStatusColor(property.status)} shadow-md`}>
            {STATUS_LABELS[property.status]}
          </Badge>
          
          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-9 w-9 bg-white/90 hover:bg-white shadow-md"
              onClick={toggleSave}
              disabled={isLoadingSave}
            >
              <Heart className={`h-4 w-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-9 w-9 bg-white/90 hover:bg-white shadow-md"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Image count indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              1/{images.length}
            </div>
          )}

          {/* New listing badge */}
          {new Date(property.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
            <Badge className="absolute top-3 left-20 bg-primary text-primary-foreground shadow-md">
              New
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2 pt-4">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(property.asking_price)}
            </span>
            {property.equity_percentage && property.equity_percentage > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <TrendingUp className="h-4 w-4" />
                    {property.equity_percentage}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>Equity percentage</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg text-foreground line-clamp-1 mt-1">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{property.address}, {property.city}, {property.state}</span>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-3">
          {/* Property specs */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms} bd</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms} ba</span>
              </div>
            )}
            {property.sqft && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.sqft.toLocaleString()} sqft</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {DEAL_TYPE_LABELS[property.deal_type]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {CONDITION_LABELS[property.condition]}
            </Badge>
          </div>

          {/* ARV if available */}
          {property.arv && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
              <span className="text-muted-foreground">ARV</span>
              <span className="font-medium">{formatPrice(property.arv)}</span>
            </div>
          )}
        </CardContent>

        {/* Seller info & footer */}
        <CardFooter className="border-t bg-muted/30 pt-3 pb-3 flex-col gap-3">
          {showSeller && sellerInfo && (
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={sellerInfo.avatar_url} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {sellerInfo.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">
                    {sellerInfo.company_name || sellerInfo.full_name}
                  </span>
                  {sellerInfo.is_verified && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="h-3.5 w-3.5 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>Verified Seller</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {sellerInfo.deals_closed > 0 && (
                    <span>{sellerInfo.deals_closed} deals</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between w-full gap-2">
            <Button variant="default" className="flex-1" asChild>
              <Link to={`/property/${property.id}`}>
                View Details
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}
            </div>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}