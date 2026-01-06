import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmailCaptureForm } from '@/components/lead-capture/EmailCaptureForm';
import { Lock, Target, Building2, Gift, CheckCircle2, TrendingUp, Zap, ArrowRight } from 'lucide-react';

interface MarketplaceGateProps {
  children: React.ReactNode;
}

export function MarketplaceGate({ children }: MarketplaceGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If user is logged in, show the marketplace
  if (user) {
    return <>{children}</>;
  }

  // Show gated content for non-logged-in users
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 text-sm px-4 py-2">
              <Lock className="w-4 h-4 mr-2" />
              Members Only Access
            </Badge>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Exclusive Deal Marketplace
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-8">
              Access hundreds of off-market wholesale deals matched to your investment criteria. Join 500+ active investors and wholesalers.
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-sm mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Verified Deals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Direct Messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span>Smart Matching</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gate Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Email Capture */}
          <div className="mb-12">
            <EmailCaptureForm
              leadType="general"
              landingPage="/marketplace"
              title="Unlock the Marketplace"
              subtitle="Enter your email to get free access"
              buttonText="Get Free Access"
              showNameField={true}
              benefits={[
                "Browse all active wholesale deals",
                "View property details, ARV, and repair estimates",
                "Connect directly with deal owners",
                "Get matched deals delivered to your inbox"
              ]}
            />
          </div>

          {/* Two paths */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Already know what you need?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Investor Path */}
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">I'm an Investor</CardTitle>
                <CardDescription>
                  Find off-market deals matched to your buy box
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>AI-powered deal matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span>7-day free trial</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/auth?mode=signup&role=investor">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Wholesaler Path */}
            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">I'm a Wholesaler</CardTitle>
                <CardDescription>
                  Find cash buyers for your deals fast
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>Instant buyer matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-accent" />
                    <span>1 free posting credit</span>
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                  <Link to="/auth?mode=signup&role=wholesaler">
                    Claim Free Credit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Login link */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Already a member?{' '}
              <Link to="/auth?mode=login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
