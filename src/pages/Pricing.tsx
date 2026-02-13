import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Zap, Building2, Shield, Clock, Scan, User } from 'lucide-react';
import { Link } from 'react-router-dom';

// Validate that a URL is from Stripe's trusted domains
const validateStripeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'checkout.stripe.com' ||
      parsed.hostname === 'billing.stripe.com' ||
      parsed.hostname.endsWith('.stripe.com');
  } catch {
    return false;
  }
};
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Pricing = () => {
  const { user, role } = useAuth();
  const { isSubscribed, isTrialing, trialEnd, listingCredits, planTier } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const subscribed = isSubscribed || isTrialing;

  const handleCheckout = async (priceType: string, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setLoading(priceType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType, quantity },
      });

      if (error) throw error;

      if (data?.url) {
        if (!validateStripeUrl(data.url)) {
          toast.error('Invalid checkout URL received. Please try again.');
          return;
        }
        window.open(data.url, '_blank');
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);

      let errorMessage = 'Unknown error occurred';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any; // Temporary safe cast for property access or use improved narrowing
      if (err?.context?.json?.error) {
        errorMessage = err.context.json.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error(`Checkout failed: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      if (data?.url) {
        if (!validateStripeUrl(data.url)) {
          toast.error('Invalid portal URL received. Please try again.');
          return;
        }
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Unknown error occurred';
      toast.error(`Portal access failed: ${errorMessage}`);
    } finally {
      setLoading(null);
    }
  };

  const investorBasicFeatures = [
    'Unlimited property matches',
    'Real-time email notifications',
    'Advanced buy box criteria',
    'Secure in-platform messaging',
    'Save and track deals',
  ];

  const investorProFeatures = [
    ...investorBasicFeatures,
    'AI Hunter Engine access',
    'Craigslist & MLS Scraper',
    'Priority support',
  ];

  const wholesalerFeatures = [
    'List deals on marketplace for free',
    'No listing credits required',
    'Auto-match with investors',
    'Secure in-platform messaging',
    'Track views and interest',
    'Analytics dashboard',
  ];

  return (
    <MainLayout>
      <Helmet>
        <title>Pricing - QuickLiqi | Real Estate Investment Platform</title>
        <meta name="description" content="Simple, transparent pricing for investors and wholesalers. Start with a 7-day free trial." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 gradient-hero text-primary-foreground">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">
              <Clock className="w-3 h-3 mr-1" />
              7-Day Free Trial for Investors
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Invest in Deals, Not Lead Lists
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-6">
              Stop paying for leads that don't convert. QuickLiqi delivers only the deals that match your exact criteria.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent" />
                <span>No hidden fees</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-4 -mt-12">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Investor Basic Plan */}
            <Card className="border-2 border-border shadow-lg">
              <CardHeader className="text-center pt-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">Investor Basic</CardTitle>
                <CardDescription>For casual investors</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {investorBasicFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {planTier === 'basic' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loading === 'manage'}
                  >
                    {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout('investor_basic')}
                    disabled={loading === 'investor_basic' || role === 'wholesaler' || subscribed}
                  >
                    {loading === 'investor_basic' ? 'Loading...' : 'Select Basic'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Investor Pro Plan */}
            <Card className="relative border-2 border-primary shadow-xl scale-105 z-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-display">Investor Pro</CardTitle>
                <CardDescription>Advanced tools for serious investors</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-success font-medium mt-2">
                  7-day free trial included
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {investorProFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {planTier === 'pro' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-success/10 rounded-lg text-center">
                      <p className="text-success font-medium">
                        {isTrialing ? '✨ Currently on Trial' : '✓ Pro Plan Active'}
                      </p>
                      {trialEnd && isTrialing && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Trial ends {new Date(trialEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={loading === 'manage'}
                    >
                      {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={() => handleCheckout('investor_pro')}
                    disabled={loading === 'investor_pro' || role === 'wholesaler'}
                  >
                    {loading === 'investor_pro' ? 'Loading...' : 'Start Free Trial'}
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>7-day money-back guarantee</span>
                </div>
              </CardContent>
            </Card>

            {/* Wholesaler Plan */}
            <Card className="border-2 border-border shadow-lg">
              <CardHeader className="text-center pt-8">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-accent" />
                </div>
                <CardTitle className="text-2xl font-display">Wholesaler</CardTitle>
                <CardDescription>For deal finders and wholesalers</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/listing</span>
                </div>
                <p className="text-sm text-success font-medium mt-2">
                  Free to list your deals
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {wholesalerFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to="/auth?mode=signup">Join as Wholesaler</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Reach 1000+ cache buyers</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Scraper Add-on */}
          <div className="max-w-3xl mx-auto mt-12">
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scan className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        AI Hunter Engine
                        <Badge variant="secondary">Pro Tier</Badge>
                      </h3>
                      <p className="text-muted-foreground">
                        Sourcing deals from MLS, Craigslist, and Public Records with Gemini AI
                      </p>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-2xl font-bold">$99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                    <p className="text-sm text-muted-foreground mb-3">10 scrapes/month</p>
                    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      <Link to="/scraper">Learn More</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-secondary/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">How does the 7-day trial work?</h3>
                <p className="text-muted-foreground">
                  Start your trial with full access to all Investor Pro features. You won't be charged until after 7 days. Cancel anytime during the trial at no cost.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">What's the money-back guarantee?</h3>
                <p className="text-muted-foreground">
                  If you're not satisfied within your first week as a paid subscriber, contact us for a full refund. No questions asked.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Do listing credits expire?</h3>
                <p className="text-muted-foreground">
                  No! Your listing credits never expire. Use them whenever you have a deal to post.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Can I switch between roles?</h3>
                <p className="text-muted-foreground">
                  Your role is set at signup. If you need to operate as both an investor and wholesaler, contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Pricing;
