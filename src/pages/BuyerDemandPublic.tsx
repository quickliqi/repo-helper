import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { BuyBox, PropertyType, DealType, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, CONDITION_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Helmet } from 'react-helmet-async';
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
    ArrowRight,
    ShieldCheck,
    EyeOff,
    Zap,
    UserPlus
} from 'lucide-react';

/** Omit fields that might contain PII */
interface AnonymizedBuyBox {
    id: string;
    label: string;
    property_types: BuyBox['property_types'];
    deal_types: BuyBox['deal_types'];
    min_price: number | null;
    max_price: number | null;
    min_arv: number | null;
    max_arv: number | null;
    min_equity_percentage: number | null;
    preferred_conditions: BuyBox['preferred_conditions'];
    target_cities: string[];
    target_states: string[];
    target_zip_codes: string[];
}

export default function BuyerDemandPublic() {
    const [buyBoxes, setBuyBoxes] = useState<AnonymizedBuyBox[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
    const [dealTypeFilter, setDealTypeFilter] = useState<string>('all');

    useEffect(() => {
        fetchPublicBuyBoxes();
    }, []);

    const fetchPublicBuyBoxes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('buy_boxes')
                .select('id, property_types, deal_types, min_price, max_price, min_arv, max_arv, min_equity_percentage, preferred_conditions, target_cities, target_states, target_zip_codes')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Anonymize: assign generic labels, strip any PII
            const anonymized: AnonymizedBuyBox[] = (data || []).map((bb, i) => ({
                id: bb.id,
                label: `Active Buy Box #${i + 1}`,
                property_types: (bb.property_types || []) as BuyBox['property_types'],
                deal_types: (bb.deal_types || []) as BuyBox['deal_types'],
                min_price: bb.min_price ?? null,
                max_price: bb.max_price ?? null,
                min_arv: bb.min_arv ?? null,
                max_arv: bb.max_arv ?? null,
                min_equity_percentage: bb.min_equity_percentage ?? null,
                preferred_conditions: (bb.preferred_conditions || []) as BuyBox['preferred_conditions'],
                target_cities: bb.target_cities || [],
                target_states: bb.target_states || [],
                target_zip_codes: bb.target_zip_codes || [],
            }));

            setBuyBoxes(anonymized);
        } catch (error) {
            console.error('Error fetching public buy boxes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBuyBoxes = buyBoxes.filter(bb => {
        const matchesSearch =
            bb.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    // Aggregate stats
    const uniqueLocations = new Set(buyBoxes.flatMap(bb => [...(bb.target_cities || []), ...(bb.target_states || [])]));
    const avgMaxPrice = buyBoxes.reduce((acc, bb) => acc + (bb.max_price || 0), 0) / (buyBoxes.filter(bb => bb.max_price).length || 1);

    return (
        <MainLayout>
            <Helmet>
                <title>Investor Demand — Active Buy Boxes | QuickLiqi</title>
                <meta name="description" content="Browse live investor buy boxes to understand what institutional and retail buyers are actively seeking. Source deals that match real demand." />
                <link rel="canonical" href="https://quickliqi.com/demand" />
                <meta property="og:title" content="Investor Demand — Active Buy Boxes | QuickLiqi" />
                <meta property="og:description" content="Browse live investor buy boxes to understand what buyers are actively seeking. Source deals that match real demand." />
                <meta property="og:url" content="https://quickliqi.com/demand" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="QuickLiqi" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Investor Demand — Active Buy Boxes | QuickLiqi" />
                <meta name="twitter:description" content="Browse live investor buy boxes to see what buyers are actively seeking." />
            </Helmet>

            <div className="bg-background min-h-screen">
                {/* Hero Header */}
                <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
                    <div className="container mx-auto px-4 py-12 md:py-16">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                                    <Target className="h-3 w-3 mr-1" />
                                    Live Demand Signal
                                </Badge>
                                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                                    Investor Buy Box Demand
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-xl">
                                    See exactly what investors are looking for — source deals that match real demand
                                    before anyone else.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button asChild size="lg">
                                    <Link to="/auth?mode=signup">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Sign Up to Post Deals
                                    </Link>
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">Free for wholesalers</p>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-6 mt-8 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <EyeOff className="h-4 w-4 text-primary" />
                                Anonymous — Investor identity protected
                            </span>
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Verified active buy boxes only
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-primary" />
                                Updated in real-time
                            </span>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Users className="h-4 w-4" />
                                    <span className="text-sm">Active Buyers</span>
                                </div>
                                <p className="text-2xl font-bold text-success">
                                    {isLoading ? '—' : buyBoxes.length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">Target Markets</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {isLoading ? '—' : uniqueLocations.size}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm">Avg. Max Budget</span>
                                </div>
                                <p className="text-2xl font-bold">
                                    {isLoading ? '—' : formatPrice(avgMaxPrice)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by city or state..."
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

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : buyBoxes.length === 0 ? (
                        <div className="text-center py-20">
                            <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">No active buyer demand yet</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Investors haven't set up their buy boxes yet. Check back soon or sign up to be notified
                                when new demand appears.
                            </p>
                            <Button asChild>
                                <Link to="/auth?mode=signup">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Get Notified
                                </Link>
                            </Button>
                        </div>
                    ) : filteredBuyBoxes.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No buy boxes match your filters. Try broadening your search.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Showing {filteredBuyBoxes.length} active buy box{filteredBuyBoxes.length !== 1 ? 'es' : ''}
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBuyBoxes.map((buyBox) => (
                                    <Card key={buyBox.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary/30">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Target className="h-5 w-5 text-primary" />
                                                        {buyBox.label}
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
                                                    {formatPrice(buyBox.min_price)} – {formatPrice(buyBox.max_price)}
                                                </p>
                                            </div>

                                            {/* Locations */}
                                            {(buyBox.target_cities?.length > 0 || buyBox.target_states?.length > 0) && (
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
                                            )}

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

                    {/* CTA Section */}
                    <section className="mt-16 mb-8">
                        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                            <CardContent className="py-12 text-center">
                                <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Have a Deal That Matches?
                                </h2>
                                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                                    Sign up as a wholesaler to post deals, get automatic matching with active buyers,
                                    and close faster on the QuickLiqi marketplace.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button asChild size="lg">
                                        <Link to="/auth?mode=signup">
                                            Post a Deal
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link to="/marketplace">Browse Marketplace</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
