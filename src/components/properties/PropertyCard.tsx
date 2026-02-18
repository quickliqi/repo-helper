import { Property, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS, STATUS_LABELS } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Home,
  DollarSign,
  TrendingUp,
  Eye,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  property: Property;
  showActions?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
}

export function PropertyCard({ property, showActions = true, onSave, isSaved = false }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'under_contract':
        return 'bg-accent text-accent-foreground';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'sold':
        return 'bg-primary text-primary-foreground';
      case 'withdrawn':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {property.image_urls && property.image_urls.length > 0 ? (
          <img
            src={property.image_urls[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${getStatusColor(property.status)}`}>
          {STATUS_LABELS[property.status]}
        </Badge>
        {showActions && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-card/80 hover:bg-card"
            onClick={onSave}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-accent' : ''}`} />
          </Button>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {property.address || property.title}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {property.city}, {property.state} {property.zip_code ? property.zip_code : ''}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(property.asking_price)}
          </span>
          {property.arv && (
            <span className="text-sm text-muted-foreground">
              ARV: {formatPrice(property.arv)}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {PROPERTY_TYPE_LABELS[property.property_type]}
          </Badge>
          <Badge variant="outline">
            {DEAL_TYPE_LABELS[property.deal_type]}
          </Badge>
          <Badge variant="outline">
            {CONDITION_LABELS[property.condition]}
          </Badge>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {property.bedrooms && (
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="font-semibold text-foreground">{property.bedrooms}</p>
              <p className="text-xs text-muted-foreground">Beds</p>
            </div>
          )}
          {property.bathrooms && (
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="font-semibold text-foreground">{property.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Baths</p>
            </div>
          )}
          {property.sqft && (
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="font-semibold text-foreground">{property.sqft.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Sq Ft</p>
            </div>
          )}
        </div>

        {/* Equity & Assignment Fee */}
        {(property.equity_percentage || property.assignment_fee) && (
          <div className="flex items-center justify-between text-sm border-t pt-3">
            {property.equity_percentage && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="font-medium text-success">{property.equity_percentage}% Equity</span>
              </div>
            )}
            {property.assignment_fee && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fee: {formatPrice(property.assignment_fee)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/30 gap-2">
        <Button variant="default" className="flex-1" asChild>
          {property.listing_url ? (
            <a href={property.listing_url} target="_blank" rel="noopener noreferrer">
              View Listing
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          ) : (
            <Link to={`/property/${property.id}`}>
              View Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          )}
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {property.views_count}
        </div>
      </CardFooter>
    </Card>
  );
}