import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Property, 
  Profile,
  PROPERTY_TYPE_LABELS, 
  DEAL_TYPE_LABELS, 
  CONDITION_LABELS, 
  STATUS_LABELS 
} from '@/types/database';
import { 
  MapPin, 
  Home, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Ruler,
  BedDouble,
  Bath,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Shield,
  Lock,
  CheckCircle2,
  Share2,
  Bookmark
} from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, role } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasContactedSeller, setHasContactedSeller] = useState(false);
  const [sellerEmail, setSellerEmail] = useState<string | null>(null);

  // Verification check removed - will be re-enabled with proper ID verification service later

  useEffect(() => {
    if (id) {
      fetchProperty();
      incrementViewCount();
    }
  }, [id]);

  useEffect(() => {
    if (id && user && property) {
      checkExistingContact();
    }
  }, [id, user, property]);

  const fetchProperty = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data as Property);

      // Fetch seller profile (without exposing contact details yet)
      if (data?.user_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('full_name, company_name, city, state, is_verified, verification_status')
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        setSeller(sellerData as Profile);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingContact = async () => {
    if (!id || !user || !property) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('property_id', id)
        .eq('investor_id', user.id)
        .maybeSingle();
      
      if (data) {
        setHasContactedSeller(true);
        // Fetch full seller details including phone
        const { data: fullSeller } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', property.user_id)
          .maybeSingle();
        
        if (fullSeller) {
          setSeller(fullSeller as Profile);
        }
        
        // Get seller's email
        // Note: We'll get this from the contact_requests as we stored it when created
      }
    } catch (error) {
      console.error('Error checking contact status:', error);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;
    // Increment view count - just update without RPC
    try {
      await supabase
        .from('properties')
        .update({ views_count: (property?.views_count || 0) + 1 })
        .eq('id', id);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const handleContactSeller = async () => {
    if (!user || !property || !seller || !profile) return;

    setIsSending(true);
    try {
      // Get user's email from auth
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData?.user?.email;

      if (!userEmail) {
        toast.error('Unable to get your email. Please try again.');
        return;
      }

      // Create contact request record
      const { error: insertError } = await supabase
        .from('contact_requests')
        .insert({
          property_id: property.id,
          investor_id: user.id,
          seller_id: property.user_id,
          message: message,
          investor_email: userEmail,
          investor_name: profile.full_name,
          investor_phone: profile.phone,
        });

      if (insertError) throw insertError;

      // Send notification email to the seller with investor's contact info
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'deal_contact',
          recipientEmail: property.user_id, // Will be resolved in the function
          recipientName: seller.full_name,
          viewerName: profile.full_name || 'An investor',
          viewerEmail: userEmail,
          viewerPhone: profile.phone,
          propertyTitle: property.title,
          propertyCity: property.city,
          propertyState: property.state,
          message: message,
        },
      });

      // Create a notification in the database
      await supabase.from('notifications').insert({
        user_id: property.user_id,
        title: 'New Contact Request',
        message: `${profile.full_name || 'An investor'} is interested in your property: ${property.title}`,
        type: 'contact',
        related_property_id: property.id,
      });

      // Fetch full seller details now that contact is established
      const { data: fullSeller } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', property.user_id)
        .maybeSingle();
      
      if (fullSeller) {
        setSeller(fullSeller as Profile);
      }

      setHasContactedSeller(true);
      toast.success('Contact request sent! You can now see the seller\'s contact info.');
      setShowContactDialog(false);
      setMessage('');
    } catch (error) {
      console.error('Error contacting seller:', error);
      toast.error('Failed to send contact request');
    } finally {
      setIsSending(false);
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
      case 'active':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'under_contract':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'pending':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'sold':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
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

  if (!property) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">This property may have been removed or is no longer available.</p>
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
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Link>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="rounded-xl overflow-hidden bg-muted aspect-video">
                {property.image_urls && property.image_urls.length > 0 ? (
                  <img 
                    src={property.image_urls[0]} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getStatusColor(property.status)}>
                    {STATUS_LABELS[property.status]}
                  </Badge>
                  <Badge variant="outline">{DEAL_TYPE_LABELS[property.deal_type]}</Badge>
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  {property.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                </div>
              </div>

              {/* Price & Key Metrics */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                      <p className="text-3xl font-bold text-foreground">{formatPrice(property.asking_price)}</p>
                    </div>
                    {property.arv && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">ARV</p>
                        <p className="text-2xl font-semibold text-foreground">{formatPrice(property.arv)}</p>
                      </div>
                    )}
                    {property.repair_estimate && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Repair Estimate</p>
                        <p className="text-2xl font-semibold text-foreground">{formatPrice(property.repair_estimate)}</p>
                      </div>
                    )}
                    {property.equity_percentage && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Equity</p>
                        <p className="text-2xl font-semibold text-green-600">{property.equity_percentage}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">{PROPERTY_TYPE_LABELS[property.property_type]}</p>
                      </div>
                    </div>
                    {property.bedrooms && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <BedDouble className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bedrooms</p>
                          <p className="font-medium">{property.bedrooms}</p>
                        </div>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Bath className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bathrooms</p>
                          <p className="font-medium">{property.bathrooms}</p>
                        </div>
                      </div>
                    )}
                    {property.sqft && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Ruler className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sq Ft</p>
                          <p className="font-medium">{property.sqft.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {property.year_built && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year Built</p>
                          <p className="font-medium">{property.year_built}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Condition</p>
                        <p className="font-medium">{CONDITION_LABELS[property.condition]}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {property.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{property.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {property.highlights && property.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {property.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Seller Card */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {hasContactedSeller ? 'Seller Contact Info' : 'Contact Seller'}
                  </CardTitle>
                  <CardDescription>
                    {hasContactedSeller 
                      ? 'You have access to this seller\'s contact information'
                      : 'Request contact info to connect with this wholesaler'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasContactedSeller && seller ? (
                    // Show full seller contact info after contact request
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">Contact info unlocked</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {seller.full_name?.[0]?.toUpperCase() || 'W'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{seller.full_name}</p>
                          {seller.company_name && (
                            <p className="text-sm text-muted-foreground">{seller.company_name}</p>
                          )}
                        </div>
                      </div>
                      
                      {seller.phone && (
                        <a 
                          href={`tel:${seller.phone}`}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <Phone className="h-5 w-5 text-primary" />
                          <span className="font-medium">{seller.phone}</span>
                        </a>
                      )}
                      
                      {seller.city && seller.state && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span>{seller.city}, {seller.state}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show limited info before contact request
                    <>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Wholesaler</p>
                          <p className="text-sm text-muted-foreground">Request access to see details</p>
                        </div>
                      </div>

                      {!user ? (
                        <div className="text-center py-4">
                          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">Sign in to request contact info</p>
                          <Button asChild className="w-full">
                            <Link to="/auth">Sign In</Link>
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => setShowContactDialog(true)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Contact Info
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" onClick={() => setIsSaved(!isSaved)}>
                      <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Saved' : 'Save Property'}
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Fee */}
              {property.assignment_fee && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assignment Fee</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(property.assignment_fee)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to {seller?.full_name} about this property
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium text-sm">{property.title}</p>
              <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
            </div>
            <Textarea
              placeholder="Write your message here... (e.g., I'm interested in this property and would like to learn more about the deal.)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContactSeller} disabled={isSending || !message.trim()}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
