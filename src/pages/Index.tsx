import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import {
  Building2,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  AlertTriangle,
  Sparkles,
  Search,
  Bell,
  Handshake,
  DollarSign,
  Timer,
  Flame,
  Signal
} from 'lucide-react';
import heroImage from '@/assets/hero-deal-matching.jpg';
import investorImage from '@/assets/investor-analyzing.jpg';
import wholesalerImage from '@/assets/wholesaler-property.jpg';
import matchingImage from '@/assets/matching-visualization.jpg';

export default function Index() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Helmet>
        <title>QuickLiqi - Institutional-Grade Wholesale Dispositions & Deal Flow</title>
        <meta name="description" content="Liquidity infrastructure for real estate assets. Match wholesale contracts with verified institutional capital and high-volume operators instantly." />
        <link rel="canonical" href="https://realquickliqi.com" />
      </Helmet>

      {/* Hero Section - Optimized for urgency */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Wholesalers and investors closing off-market real estate deals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Urgency Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6 backdrop-blur-sm">
              <Signal className="h-4 w-4" />
              <span className="text-sm font-medium">Liquidity Optimization for Wholesale Assets</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Institutional-Grade<br />
              <span className="text-accent">Dispositions Infrastructure.</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mb-8">
              <strong>Wholesalers:</strong> Streamline disposition workflows—match contracts to verified institutional capital instantly.
              <strong className="block mt-2">Investors:</strong> Access off-market liquidity with standardized data, ARV, and repair analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {user ? (
                <Button size="lg" asChild className="text-base bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="text-base bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                  <Link to="/auth?mode=signup">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Access Liquidity Network
                  </Link>
                </Button>
              )}
            </div>

            {/* Quick Stats - Social Proof */}
            <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-8 text-primary-foreground/80">
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-accent">500+</p>
                <p className="text-xs sm:text-sm">Verified Buyers</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-accent">$2M+</p>
                <p className="text-xs sm:text-sm">Transaction Volume</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-accent">24hrs</p>
                <p className="text-xs sm:text-sm">Avg. Liquidity Event</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - SEO Keywords */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">The Market Inefficiency</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Legacy Dispositions Are Failing
            </h2>
            <p className="text-lg text-muted-foreground">
              Contract expiration risks and unverified buyer data create pipeline drag.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Investor Problems */}
            <div className="bg-card rounded-xl p-8 shadow-card border-l-4 border-destructive/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Acquisition Friction
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Deal velocity mismatch</span> leads to missed opportunities
                  </p>
                </li>

                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">No ARV or repair numbers</span>—just vague "good deal" claims
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Inbox flooded</span> with properties outside your buy box
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Cash ready</span> but can't find the right fix-and-flip or BRRRR deal
                  </p>
                </li>
              </ul>
            </div>

            {/* Wholesaler Problems */}
            <div className="bg-card rounded-xl p-8 shadow-card border-l-4 border-destructive/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Disposition Inefficiency
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Contract expiration risk</span> due to buyer list unresponsiveness
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Low conversion rates</span> from non-targeted email blasts
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Lack of buyer intent data</span> for current market cycle
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Assignment failure</span> caused by slow disposition velocity
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">The Infrastructure Solution</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              QuickLiqi: Algorithmic Deal Matching
            </h2>
            <p className="text-lg text-muted-foreground">
              Single-point entry. Automated matching to verified institutional buy boxes.
            </p>
          </div>

          {/* Matching Visualization */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={matchingImage}
                alt="Wholesale deal matching with cash buyers visualization"
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent flex items-end">
                <div className="p-8 text-primary-foreground">
                  <h3 className="font-display text-2xl font-bold mb-2">Intelligent Buy Box Matching</h3>
                  <p className="text-primary-foreground/80 max-w-2xl">
                    Every wholesale deal is analyzed against active investor buy boxes. Match scores, ARV, repair estimates—everything they need to make fast offers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-6 mx-auto">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Post Your Assignment
              </h3>
              <p className="text-muted-foreground">
                Upload photos, enter ARV, repair costs, and assignment fee. Our system does the rest.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 mb-6 mx-auto">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Instant Cash Buyer Match
              </h3>
              <p className="text-muted-foreground">
                Our algorithm matches your deal to investors actively buying in that market—in real-time.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-6 mx-auto">
                <Handshake className="h-7 w-7 text-success" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Close Your Assignment
              </h3>
              <p className="text-muted-foreground">
                Message verified buyers securely through our platform. No middlemen, no tire-kickers—just closers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - SEO Rich */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How QuickLiqi Works for Real Estate Pros
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're disposing wholesale contracts or hunting off-market deals—get started in minutes.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Investors */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-card">
              <div className="h-48 overflow-hidden">
                <img
                  src={investorImage}
                  alt="Real estate investor analyzing fix and flip deals with buy box criteria"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-foreground">
                      For Cash Buyers & Investors
                    </h3>
                    <p className="text-sm text-muted-foreground">Fix-and-flip, BRRRR, buy-and-hold</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Set Your Buy Box Criteria</p>
                      <p className="text-sm text-muted-foreground">Location, price range, ARV, property type, deal type, minimum equity—be as specific as you want.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Get Off-Market Deals Delivered</p>
                      <p className="text-sm text-muted-foreground">Instant email alerts when wholesale deals match your criteria—before they hit anyone's blast list.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Make Offers Confidently</p>
                      <p className="text-sm text-muted-foreground">Every deal includes ARV, repair estimates, and assignment fee. All the numbers on a silver platter.</p>
                    </div>
                  </div>
                </div>
                {!user && (
                  <Button asChild className="w-full mt-6 bg-success hover:bg-success/90 text-success-foreground">
                    <Link to="/auth?mode=signup&role=investor">
                      Find Deals That Match My Buy Box
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* For Wholesalers */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-card">
              <div className="h-48 overflow-hidden">
                <img
                  src={wholesalerImage}
                  alt="Wholesaler with property under contract needing cash buyer fast"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-foreground">
                      For Wholesalers & Dispositions
                    </h3>
                    <p className="text-sm text-muted-foreground">Move contracts fast, stop chasing buyers</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Post Your Wholesale Deal</p>
                      <p className="text-sm text-muted-foreground">Upload photos, enter your numbers. Takes 5 minutes—we capture everything buyers need to decide.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Reach Active Cash Buyers Instantly</p>
                      <p className="text-sm text-muted-foreground">Your deal is matched to investors whose buy box fits—no more blasting to dead lists.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">See What Buyers Actually Want</p>
                      <p className="text-sm text-muted-foreground">Browse active buy boxes before you source. Know exactly what investors are looking for.</p>
                    </div>
                  </div>
                </div>
                {!user && (
                  <Button asChild className="w-full mt-6">
                    <Link to="/auth?mode=signup&role=wholesaler">
                      Find Buyers for My Deal Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - SEO Keywords */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Speed. Built for Closers.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional tools for serious wholesalers and investors who move fast on off-market real estate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Detailed Buy Box Matching
              </h3>
              <p className="text-sm text-muted-foreground">
                Filter by location, price, ARV, property type, deal type (fix-and-flip, BRRRR, subject-to), and condition.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Instant Deal Alerts
              </h3>
              <p className="text-sm text-muted-foreground">
                Email the second a wholesale deal matches your criteria. Be first to make an offer.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 mb-4">
                <Users className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Verified Cash Buyers
              </h3>
              <p className="text-sm text-muted-foreground">
                Every investor is verified. No tire-kickers—only serious buyers who close.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Market Demand Intelligence
              </h3>
              <p className="text-sm text-muted-foreground">
                Wholesalers: see active buyer demand. Investors: know what's being sourced in your markets.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Real-Time Deal Flow
              </h3>
              <p className="text-sm text-muted-foreground">
                New wholesale deals, price drops, and status changes appear instantly. Never miss a hot deal.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 mb-4">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Secure & Professional
              </h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security. Your deal data and buyer communications are protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Where Wholesalers & Investors Close Deals Faster
              </h2>
              <p className="text-lg text-muted-foreground">
                Join the network of real estate pros who stopped chasing and started closing.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">93%</p>
                <p className="text-muted-foreground">of investors find matching deals within 7 days</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">24hrs</p>
                <p className="text-muted-foreground">average time to first cash buyer response</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-success mb-2">$50K+</p>
                <p className="text-muted-foreground">average wholesale deal size on platform</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Verified Cash Buyers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Secure Messaging</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Deal Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>No Tire-Kickers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Urgency Focused */}
      {!user && (
        <section className="py-20 gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Secure Liquidity for Your Contracts
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Eliminate disposition friction. Connect your wholesale assets with verified institutional capital today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                <Link to="/auth?mode=signup">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Join the Network
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/pricing">
                  View Pricing Models
                </Link>
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Professional Tier Access • Validated Buyers • Secure Transaction Flow
            </p>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
