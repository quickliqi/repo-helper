import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmailCaptureForm } from '@/components/lead-capture/EmailCaptureForm';
import { useUTM } from '@/hooks/useUTM';
import { 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  Zap, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Gift,
  Shield,
  Users,
  Building2,
  Sparkles,
  Timer,
  Star,
  AlertTriangle
} from 'lucide-react';

export default function AdLanding() {
  const [searchParams] = useSearchParams();
  const { utmParams } = useUTM();
  
  // Determine which variant to show based on UTM or query params
  const audience = searchParams.get('audience') || searchParams.get('a') || 'investor';
  const isInvestor = audience === 'investor' || audience === 'i';
  const isWholesaler = audience === 'wholesaler' || audience === 'w';

  // Track page view
  useEffect(() => {
    console.log('Ad landing page viewed:', { audience, utmParams });
  }, [audience, utmParams]);

  return (
    <MainLayout>
      <Helmet>
        <title>{isInvestor ? 'Find Off-Market Deals Fast' : 'Find Cash Buyers in 24 Hours'} | QuickLiqi</title>
        <meta name="description" content={isInvestor 
          ? "Get off-market wholesale deals matched to your buy box. 7-day free trial, no credit card required."
          : "Post your wholesale deal and find verified cash buyers in 24 hours. First deal is FREE."
        } />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Urgency Banner */}
      <div className="bg-accent text-accent-foreground py-2 text-center">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isInvestor 
              ? "Limited Time: 7-Day FREE Trial — No Credit Card Required" 
              : "New Wholesalers: Your First Listing is 100% FREE"
            }
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 text-sm px-4 py-2">
                <Gift className="w-4 h-4 mr-2" />
                {isInvestor ? "7-Day Free Trial" : "1 Free Listing Credit"}
              </Badge>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
                {isInvestor ? (
                  <>
                    Stop Wasting Time.<br />
                    <span className="text-accent">Get Matched Deals Instantly.</span>
                  </>
                ) : (
                  <>
                    Find Cash Buyers<br />
                    <span className="text-accent">In 24 Hours, Not Weeks.</span>
                  </>
                )}
              </h1>
              
              <p className="text-xl text-primary-foreground/90 mb-8">
                {isInvestor 
                  ? "Our AI matches you with off-market wholesale deals that fit your exact investment criteria. No cold calling. No wasted time."
                  : "Post your deal once, and we instantly match it with 500+ verified investors who are actively looking for exactly what you have."
                }
              </p>

              <div className="space-y-3 mb-8">
                {(isInvestor ? [
                  { icon: Target, text: 'Deals pre-filtered to your buy box' },
                  { icon: Zap, text: 'Instant notifications when deals drop' },
                  { icon: Shield, text: 'Only verified wholesalers' },
                ] : [
                  { icon: Users, text: 'Access to 500+ verified buyers' },
                  { icon: Clock, text: 'First inquiries within 24 hours' },
                  { icon: DollarSign, text: 'No monthly fees—pay per listing' },
                ]).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-primary-foreground">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  ))}
                </div>
                <span>
                  <strong className="text-primary-foreground">500+</strong> {isInvestor ? 'investors' : 'wholesalers'} already using QuickLiqi
                </span>
              </div>
            </div>

            {/* Lead Capture Form */}
            <div>
              <EmailCaptureForm
                leadType={isInvestor ? 'investor' : 'wholesaler'}
                landingPage={`/ad${window.location.search}`}
                title={isInvestor ? "Start Your Free Trial" : "Claim Your Free Credit"}
                subtitle={isInvestor ? "7 days free, no credit card required" : "Post your first deal for free"}
                buttonText={isInvestor ? "Start Free Trial" : "Claim Free Credit"}
                showNameField={true}
                benefits={isInvestor ? [
                  "Full access to all matching features",
                  "Unlimited buy boxes",
                  "Direct messaging with sellers",
                  "Cancel anytime"
                ] : [
                  "Your deal matched with buyers",
                  "See real interest before paying",
                  "No credit card required",
                  "Additional listings just $10"
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isInvestor ? "Tired of Missing Good Deals?" : "Struggling to Find Buyers?"}
            </h2>
            <p className="text-lg text-muted-foreground">
              {isInvestor 
                ? "Most investors waste hours cold calling and networking only to find deals that don't fit their criteria."
                : "Most wholesalers spend weeks cold calling and posting in Facebook groups hoping to find a buyer."
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-lg text-destructive">The Old Way</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {(isInvestor ? [
                    "Hours of cold calling wholesalers",
                    "Sorting through irrelevant deals",
                    "Missing deals because you're too slow",
                    "Paying for leads that don't fit",
                  ] : [
                    "Cold calling for hours to find buyers",
                    "Posting in Facebook groups with no response",
                    "Deals expiring before you find a buyer",
                    "Paying for expensive buyer lists",
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-destructive">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-lg text-accent">With QuickLiqi</h3>
                </div>
                <ul className="space-y-3 text-sm text-foreground">
                  {(isInvestor ? [
                    "Deals matched to your exact criteria",
                    "Instant notifications when deals drop",
                    "Direct messaging with sellers",
                    "Only pay when you're ready",
                  ] : [
                    "Instantly matched with interested buyers",
                    "First inquiries within 24 hours",
                    "Verified investors ready to close",
                    "Pay only when you post—no monthly fees",
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent">
              <Gift className="w-4 h-4 mr-2" />
              {isInvestor ? "7-Day Free Trial" : "First Listing Free"}
            </Badge>
            
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to {isInvestor ? "Find Your Next Deal?" : "Find Your Buyer?"}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              {isInvestor 
                ? "Join 500+ investors who are already getting matched deals. No credit card required."
                : "Join hundreds of wholesalers who are closing deals faster. Your first listing is free."
              }
            </p>

            <Button size="lg" asChild className="px-8 py-6 text-lg">
              <Link to={`/auth?mode=signup&role=${isInvestor ? 'investor' : 'wholesaler'}`}>
                <Sparkles className="mr-2 h-5 w-5" />
                {isInvestor ? "Start My Free Trial" : "Claim My Free Credit"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              {isInvestor ? "Cancel anytime. No strings attached." : "No credit card required."}
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
