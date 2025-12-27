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
  CheckCircle
} from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">The smartest way to match deals</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Where Real Estate Deals<br />
              <span className="text-accent">Find Their Perfect Match</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              The professional marketplace connecting wholesalers with verified investors. 
              Post your deals or set your buy box—our matching engine handles the rest.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" asChild className="text-base">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="text-base">
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Serious Deal Makers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're sourcing deals or looking for your next investment, 
              DealMatch streamlines the process from search to close.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Smart Matching
              </h3>
              <p className="text-muted-foreground">
                Our algorithm automatically matches new listings to investors based on their 
                specific buy box criteria—location, price, property type, and more.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Verified Network
              </h3>
              <p className="text-muted-foreground">
                Connect with verified wholesalers and investors. See what buyers are actively 
                looking for and which sellers have the best track records.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Real-Time Insights
              </h3>
              <p className="text-muted-foreground">
                Track your listings, monitor matches, and understand market demand. 
                Make data-driven decisions with comprehensive analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes—whether you're buying or selling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Investors */}
            <div className="bg-card rounded-xl p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  For Investors
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Create Your Buy Box</p>
                    <p className="text-sm text-muted-foreground">Define your ideal deal: location, price range, property type, and more.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Get Matched Automatically</p>
                    <p className="text-sm text-muted-foreground">Receive notifications when new deals match your criteria.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Connect & Close</p>
                    <p className="text-sm text-muted-foreground">Reach out to wholesalers and secure your next investment.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Wholesalers */}
            <div className="bg-card rounded-xl p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  For Wholesalers
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Post Your Deals</p>
                    <p className="text-sm text-muted-foreground">List properties with all the details investors need to make decisions.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">See Buyer Demand</p>
                    <p className="text-sm text-muted-foreground">Browse active buy boxes to understand what investors are looking for.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Move Deals Faster</p>
                    <p className="text-sm text-muted-foreground">Get matched with qualified buyers and close deals quickly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built with Trust & Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Your data is protected with enterprise-grade security. We verify users to ensure 
              you're connecting with legitimate buyers and sellers.
            </p>
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Find Your Next Deal?
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join thousands of real estate professionals already using DealMatch to 
              connect, transact, and grow their portfolios.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base">
              <Link to="/auth?mode=signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </MainLayout>
  );
}