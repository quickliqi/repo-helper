import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
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
  Handshake
} from 'lucide-react';
import heroImage from '@/assets/hero-deal-matching.jpg';
import investorImage from '@/assets/investor-analyzing.jpg';
import wholesalerImage from '@/assets/wholesaler-property.jpg';
import matchingImage from '@/assets/matching-visualization.jpg';

export default function Index() {
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Real estate professionals closing deals" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Stop wasting time on bad leads</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              The Fastest Way to<br />
              <span className="text-accent">Match Deals to Buyers</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mb-8">
              QuickLiqi is the professional marketplace that automatically connects off-market real estate deals 
              with qualified investors. No more cold calls, no more guessing—just smart matches that close.
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
                <>
                  <Button size="lg" asChild className="text-base bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/auth?mode=signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <Link to="/marketplace">
                      Browse Deals
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 text-primary-foreground/80">
              <div>
                <p className="text-2xl font-bold text-accent">500+</p>
                <p className="text-sm">Active Investors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">$2M+</p>
                <p className="text-sm">Deals Matched</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">24hrs</p>
                <p className="text-sm">Avg. Response Time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">The Problem</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Real Estate Deals Die in the Gap
            </h2>
            <p className="text-lg text-muted-foreground">
              Great deals get stuck between sellers who need to move fast and buyers who can't find them in time.
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
                  If You're an Investor...
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Missing deals</span> because you hear about them after they're gone
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Wasting hours</span> on deals that don't match your criteria
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Drowning in emails</span> from wholesalers with irrelevant properties
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">No visibility</span> into what's actually available in your target markets
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
                  If You're a Wholesaler...
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Can't find buyers</span> fast enough before sellers back out
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Blasting emails</span> to lists that rarely convert
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">No idea</span> what buyers actually want right now
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Losing deals</span> to competitors who reach buyers first
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
              <span className="text-sm font-medium">The Solution</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              QuickLiqi Bridges the Gap
            </h2>
            <p className="text-lg text-muted-foreground">
              Our smart matching engine connects the right deals with the right buyers—automatically.
            </p>
          </div>

          {/* Matching Visualization */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={matchingImage} 
                alt="Smart deal matching visualization" 
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent flex items-end">
                <div className="p-8 text-primary-foreground">
                  <h3 className="font-display text-2xl font-bold mb-2">Intelligent Matching Engine</h3>
                  <p className="text-primary-foreground/80 max-w-2xl">
                    Every property is analyzed against every active buy box. When there's a match, both parties are notified instantly.
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
                Define Your Criteria
              </h3>
              <p className="text-muted-foreground">
                Investors create detailed buy boxes. Wholesalers post deals with complete property data.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 mb-6 mx-auto">
                <Zap className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Instant Matching
              </h3>
              <p className="text-muted-foreground">
                Our algorithm runs in real-time, matching properties to buyers the moment they're posted.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-6 mx-auto">
                <Handshake className="h-7 w-7 text-success" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Close the Deal
              </h3>
              <p className="text-muted-foreground">
                Connect directly with qualified parties and move from match to close faster than ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works for You
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes—whether you're buying or selling.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Investors */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-card">
              <div className="h-48 overflow-hidden">
                <img 
                  src={investorImage} 
                  alt="Investor analyzing real estate deals" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground">
                    For Investors
                  </h3>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Create Your Buy Box</p>
                      <p className="text-sm text-muted-foreground">Define exactly what you want: location, price, property type, deal type, ARV, and more.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Get Notified Instantly</p>
                      <p className="text-sm text-muted-foreground">Receive email alerts the moment a deal matches your criteria—before anyone else.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Connect & Close</p>
                      <p className="text-sm text-muted-foreground">Contact the wholesaler directly through the platform and secure your next investment.</p>
                    </div>
                  </div>
                </div>
                {!user && (
                  <Button asChild className="w-full mt-6 bg-success hover:bg-success/90 text-success-foreground">
                    <Link to="/auth?mode=signup&role=investor">
                      Start as an Investor
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
                  alt="Wholesaler at property site" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-foreground">
                    For Wholesalers
                  </h3>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Post Your Deal</p>
                      <p className="text-sm text-muted-foreground">List your property with photos, pricing, and deal details. Our form captures everything buyers need.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Reach Qualified Buyers</p>
                      <p className="text-sm text-muted-foreground">Your deal is instantly matched to investors whose buy box criteria fit—no blasting required.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">See What Buyers Want</p>
                      <p className="text-sm text-muted-foreground">Browse active buy boxes to understand demand before you even source your next deal.</p>
                    </div>
                  </div>
                </div>
                {!user && (
                  <Button asChild className="w-full mt-6">
                    <Link to="/auth?mode=signup&role=wholesaler">
                      Start as a Wholesaler
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Move Fast
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built tools for serious real estate professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Advanced Buy Box
              </h3>
              <p className="text-sm text-muted-foreground">
                Filter by location, price, ARV, property type, deal type, condition, and more. Get only what fits.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Instant Notifications
              </h3>
              <p className="text-sm text-muted-foreground">
                Email alerts the second a match is found. Never miss a deal because you weren't watching.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 mb-4">
                <Users className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Verified Network
              </h3>
              <p className="text-sm text-muted-foreground">
                Every user is verified. Know you're dealing with legitimate buyers and sellers.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Market Intelligence
              </h3>
              <p className="text-sm text-muted-foreground">
                Wholesalers can browse buyer demand. Investors see what's actively being sourced in their markets.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Real-Time Updates
              </h3>
              <p className="text-sm text-muted-foreground">
                Listings update live. Status changes, price drops, and new deals appear instantly.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 mb-4">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Secure Platform
              </h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security. Your data and communications are protected.
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
                Trusted by Real Estate Professionals
              </h2>
              <p className="text-lg text-muted-foreground">
                Join a growing network of investors and wholesalers who are closing more deals, faster.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">93%</p>
                <p className="text-muted-foreground">of investors find relevant deals within 7 days</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-accent mb-2">3x</p>
                <p className="text-muted-foreground">faster buyer connections for wholesalers</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-success mb-2">$50K+</p>
                <p className="text-muted-foreground">average deal size on the platform</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Verified Users</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Secure Messaging</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Data Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Stop Missing Deals. Start Closing More.
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join QuickLiqi today and connect with the right opportunities—automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth?mode=signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/pricing">
                  View Pricing Plans
                </Link>
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-4">
              7-day free trial for investors • No credit card required to sign up
            </p>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
