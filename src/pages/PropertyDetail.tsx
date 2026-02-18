import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useInvestorContext } from '@/hooks/useInvestorContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { JVSignDialog } from '@/components/agreements/JVSignDialog';
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
  Mail,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Shield,
  Lock,
  CheckCircle2,
  Share2,
  Bookmark,
  AlertTriangle,
  BrainCircuit,
  Target
} from 'lucide-react';
import { processAndLogDeal } from '@/lib/calculations';
import { GovernanceResult, DealInput } from '@/types/deal-types';
import { MatchResult } from '@/lib/matching-engine';
import { useGovernanceSettings } from '@/hooks/useGovernanceSettings';
import { CurrencyDisplay, PercentDisplay } from '@/components/common/NumberDisplay';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, role } = useAuth();
  const { buyBox, evaluateDeal } = useInvestorContext();

  const [property, setProperty] = useState<Property | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasContactedSeller, setHasContactedSeller] = useState(false);
  const [hasSignedJV, setHasSignedJV] = useState(false);
  const [showJVSignDialog, setShowJVSignDialog] = useState(false);

  // Governance & Intelligence State
  const [governance, setGovernance] = useState<GovernanceResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const { data: governanceSettings } = useGovernanceSettings();



  // Run Governance Agent when property loads
  useEffect(() => {
    if (property) {
      const runAnalysis = async () => {
        // Map Property to DealInput safely
        const dealInput: DealInput = {
          ...property,
          // Ensure enums match (should match if types are aligned)
        } as unknown as DealInput;

        const result = await processAndLogDeal(dealInput, user?.id, governanceSettings);
        setGovernance(result);
      };
      runAnalysis();
    }
  }, [property, user?.id, governanceSettings]);

  // Run Investor Context Agent when governance results or buy box changes
  useEffect(() => {
    if (property && governance && buyBox) {
      const result = evaluateDeal(property, governance.metrics);
      setMatch(result);
    }
  }, [property, governance, buyBox, evaluateDeal]);

  const fetchProperty = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data as Property);

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
  }, [id]);

  const checkExistingContact = useCallback(async () => {
    if (!id || !user || !property) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', id)
        .eq('investor_id', user.id)
        .maybeSingle();
      if (data) setHasContactedSeller(true);
    } catch (error) {
      console.error('Error checking contact status:', error);
    }
  }, [id, user, property]);

  const checkJVSigned = useCallback(async () => {
    if (!id || !user) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('jv_agreements')
        .select('id')
        .eq('property_id', id)
        .eq('investor_id', user.id)
        .maybeSingle();
      if (data) setHasSignedJV(true);
    } catch (error) {
      console.error('Error checking JV status:', error);
    }
  }, [id, user]);

  const incrementViewCount = useCallback(async () => {
    if (!id) return;
    try {
      await supabase.rpc('increment_views', { p_property_id: id });
    } catch (error) {
      // Silently fail
    }
  }, [id]);

  // Effects that depend on callbacks defined above
  useEffect(() => {
    if (id) {
      fetchProperty();
      incrementViewCount();
    }
  }, [id, fetchProperty, incrementViewCount]);

  useEffect(() => {
    if (id && user && property) {
      checkExistingContact();
      checkJVSigned();
    }
  }, [id, user, property, checkExistingContact, checkJVSigned]);

  const handleContactSeller = async () => {
    if (!user || !property || !seller || !profile) return;
    setIsSending(true);
    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', property.id)
        .eq('investor_id', user.id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            property_id: property.id,
            investor_id: user.id,
            seller_id: property.user_id,
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
        });

      if (msgError) throw msgError;

      await supabase.from('notifications').insert({
        user_id: property.user_id,
        title: 'New Message',
        message: `${profile.full_name || 'An investor'} sent you a message about: ${property.title}`,
        type: 'message',
        related_property_id: property.id,
      });

      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'new_message',
          recipientEmail: property.user_id,
          recipientName: seller.full_name,
          viewerName: profile.full_name || 'An investor',
          propertyTitle: property.title,
          propertyCity: property.city,
          propertyState: property.state,
          message: message,
        },
      });

      setHasContactedSeller(true);
      toast.success('Message sent! View your conversation in Messages.');
      setShowContactDialog(false);
      setMessage('');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleInitiateContact = () => {
    if (!user) {
      toast.error('Please sign in to contact the seller');
      return;
    }
    if (role === 'wholesaler') {
      toast.error('Wholesalers cannot contact other wholesalers for deals');
      return;
    }
    if (!hasSignedJV) {
      setShowJVSignDialog(true);
      return;
    }
    setShowContactDialog(true);
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
                  {/* Governance Confidence Badge */}
                  {governance && (
                    <Badge variant={governance.confidenceScore > 80 ? "default" : "destructive"} className="gap-1">
                      <BrainCircuit className="h-3 w-3" />
                      Confidence: {governance.confidenceScore}%
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  {property.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                </div>
              </div>

              {/* Governance & Match Alerts */}
              {match && (
                <div className={`p-4 rounded-lg border flex items-start gap-3 ${match.isMatch
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                  <Target className={`h-5 w-5 mt-0.5 ${match.isMatch ? 'text-green-600' : 'text-yellow-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${match.isMatch ? 'text-green-700' : 'text-yellow-700'}`}>
                      Investor Fit Score: {match.score}%
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {match.reasons.positive.length > 0 && (
                        <span className="text-green-600 block">✓ {match.reasons.positive[0]}</span>
                      )}
                      {match.reasons.negative.length > 0 && (
                        <span className="text-red-500 block">⚠ {match.reasons.negative[0]}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Risks Display */}
              {governance?.flags && governance.flags.length > 0 && (
                <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-semibold mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Risk Flags Detected</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-orange-800 dark:text-orange-300 space-y-1">
                    {governance.flags.map((flag, i) => (
                      <li key={i}>{flag.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* County Assessor Validation (New) */}
              {property.assessor_data && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      County Assessor Validation
                    </CardTitle>
                    <CardDescription>
                      Official public records comparison for data integrity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-muted-foreground">Metric</th>
                            <th className="text-left py-2 font-medium text-muted-foreground">Listing Data</th>
                            <th className="text-left py-2 font-medium text-muted-foreground">Official Record</th>
                            <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="border-b">
                            <td className="py-3 font-medium">Sq Ft</td>
                            <td className="py-3">{property.sqft?.toLocaleString() || '-'}</td>
                            <td className="py-3">{property.assessor_data.sqft?.toLocaleString() || '-'}</td>
                            <td className="py-3 text-center">
                              {property.sqft && property.assessor_data.sqft ? (
                                Math.abs(property.sqft - property.assessor_data.sqft) / property.assessor_data.sqft > 0.05 ? (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                    Mismatch
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Verified
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 font-medium">Bedrooms</td>
                            <td className="py-3">{property.bedrooms || '-'}</td>
                            <td className="py-3">{property.assessor_data.bedrooms || '-'}</td>
                            <td className="py-3 text-center">
                              {property.bedrooms !== undefined && property.assessor_data.bedrooms !== undefined ? (
                                property.bedrooms !== property.assessor_data.bedrooms ? (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                    Mismatch
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Verified
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 font-medium">Bathrooms</td>
                            <td className="py-3">{property.bathrooms || '-'}</td>
                            <td className="py-3">{property.assessor_data.bathrooms || '-'}</td>
                            <td className="py-3 text-center">
                              {property.bathrooms !== undefined && property.assessor_data.bathrooms !== undefined ? (
                                Math.abs(property.bathrooms - property.assessor_data.bathrooms) >= 0.5 ? (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                    Mismatch
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Verified
                                  </Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-primary/10">
                      <div>
                        <p className="text-xs text-muted-foreground">APN</p>
                        <p className="text-sm font-mono">{property.assessor_data.apn || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Assessed Value</p>
                        <p className="text-sm font-medium">
                          {property.assessor_data.assessed_value ? `$${property.assessor_data.assessed_value.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Annual Taxes</p>
                        <p className="text-sm font-medium">
                          {property.assessor_data.annual_taxes ? `$${property.assessor_data.annual_taxes.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Sale</p>
                        <p className="text-sm font-medium">
                          {property.assessor_data.last_sale_price ? `$${property.assessor_data.last_sale_price.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price & Key Metrics */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                      <p className="text-3xl font-bold text-foreground">
                        <CurrencyDisplay value={property.asking_price} />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ARV</p>
                      <p className="text-2xl font-semibold text-foreground">
                        <CurrencyDisplay value={property.arv} />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Repair Est.</p>
                      <p className="text-2xl font-semibold text-foreground">
                        <CurrencyDisplay value={property.repair_estimate} />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Equity</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {governance?.metrics ? (
                          <PercentDisplay value={governance.metrics.equityPercentage} />
                        ) : (
                          property.equity_percentage + '%'
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Analytics Card (New) */}
              {governance?.metrics && (
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-purple-500" />
                      AI Deal Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Calculated MAO (70%)</p>
                        <p className="font-mono font-medium text-lg">
                          <CurrencyDisplay value={governance.metrics.mao} fractionDigits={0} />
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Proj. ROI (Flip)</p>
                        <p className={`font-mono font-medium text-lg ${governance.metrics.roi > 15 ? 'text-green-600' : ''}`}>
                          <PercentDisplay value={governance.metrics.roi} />
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gross Equity</p>
                        <p className="font-mono font-medium text-lg">
                          <CurrencyDisplay value={governance.metrics.grossEquity} />
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    {hasContactedSeller ? 'Conversation Started' : 'Message Seller'}
                  </CardTitle>
                  <CardDescription>
                    {hasContactedSeller
                      ? 'Continue your conversation securely on the platform'
                      : 'Send a secure message to connect with this wholesaler'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasContactedSeller && seller ? (
                    // Show conversation link after initial message
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">Conversation active</span>
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

                      <Button asChild className="w-full" size="lg">
                        <Link to="/messages">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Conversation
                        </Link>
                      </Button>

                      {seller.city && seller.state && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span>{seller.city}, {seller.state}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show limited info before starting conversation
                    <>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Wholesaler</p>
                          <p className="text-sm text-muted-foreground">Send a message to start chatting</p>
                        </div>
                      </div>

                      {!user ? (
                        <div className="text-center py-4">
                          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">Sign in to message the seller</p>
                          <Button asChild className="w-full">
                            <Link to="/auth">Sign In</Link>
                          </Button>
                        </div>
                      ) : !(profile?.verification_status === 'approved' || profile?.is_verified) ? (
                        <div className="text-center py-4">
                          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">Verify your identity to contact sellers</p>
                          <Button asChild className="w-full">
                            <Link to="/verify">
                              <Shield className="h-4 w-4 mr-2" />
                              Get Verified
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleInitiateContact}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
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
                        <p className="text-2xl font-bold text-primary">
                          <CurrencyDisplay value={property.assignment_fee} />
                        </p>
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

      {property && (
        <JVSignDialog
          isOpen={showJVSignDialog}
          onClose={() => setShowJVSignDialog(false)}
          onSuccess={() => {
            setHasSignedJV(true);
            setShowContactDialog(true);
          }}
          property={{
            id: property.id,
            address: property.address,
            wholesaler_id: property.user_id,
            wholesaler_name: seller?.full_name || 'Wholesaler'
          }}
          investorName={profile?.full_name || user?.email?.split('@')[0] || 'Investor'}
        />
      )}
    </MainLayout>
  );
}
