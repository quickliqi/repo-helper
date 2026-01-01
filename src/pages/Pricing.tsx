import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Zap, Building2, CreditCard, Shield, Clock, Scan } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Pricing = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    trialing: boolean;
    subscription_end: string | null;
    trial_end: string | null;
    listing_credits: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

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
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
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
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const investorFeatures = [
    'Unlimited property matches',
    'Real-time email notifications',
    'Advanced buy box criteria',
    'Direct wholesaler contact',
    'Save and track deals',
    'Priority support',
  ];

  const wholesalerFeatures = [
    'List deals on marketplace',
    'Auto-match with investors',
    'Track views and interest',
    'Email notifications on contacts',
    'Analytics dashboard',
    'Unlimited buy box visibility',
  ];

  return (
    <MainLayout>
      <Helmet>
        <title>Pricing - DealFlow | Real Estate Investment Platform</title>
        <meta name="description" content="Simple, transparent pricing for investors and wholesalers. Start with a 7-day free trial." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 gradient-hero text-primary-foreground">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">
              <Clock className="w-3 h-3 mr-1" />
              7-Day Free Trial
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Choose the plan that fits your role. Start with a free trial, cancel anytime with our money-back guarantee.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-4 -mt-12">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Investor Plan */}
            <Card className="relative border-2 border-primary shadow-xl">
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
                <CardDescription>For active real estate investors</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-success font-medium mt-2">
                  7-day free trial included
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {investorFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {subscriptionStatus?.subscribed ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-success/10 rounded-lg text-center">
                      <p className="text-success font-medium">
                        {subscriptionStatus.trialing ? '✨ Currently on Trial' : '✓ Active Subscription'}
                      </p>
                      {subscriptionStatus.trial_end && subscriptionStatus.trialing && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Trial ends {new Date(subscriptionStatus.trial_end).toLocaleDateString()}
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
                  <span className="text-4xl font-bold text-foreground">$10</span>
                  <span className="text-muted-foreground">/listing</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pay only when you post
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

                {subscriptionStatus && subscriptionStatus.listing_credits > 0 && (
                  <div className="p-3 bg-accent/10 rounded-lg text-center">
                    <p className="text-accent font-medium">
                      {subscriptionStatus.listing_credits} credit{subscriptionStatus.listing_credits !== 1 ? 's' : ''} available
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    variant="outline"
                    className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground" 
                    size="lg"
                    onClick={() => handleCheckout('listing_credit', 1)}
                    disabled={loading === 'listing_credit' || role === 'investor'}
                  >
                    {loading === 'listing_credit' ? 'Loading...' : 'Buy 1 Credit - $10'}
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full" 
                    size="lg"
                    onClick={() => handleCheckout('listing_credit', 5)}
                    disabled={loading === 'listing_credit' || role === 'investor'}
                  >
                    Buy 5 Credits - $50
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Credits never expire</span>
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
                        AI Deal Scraper
                        <Badge variant="secondary">Add-on</Badge>
                      </h3>
                      <p className="text-muted-foreground">
                        Scrape Facebook for deals matching your buy box with 85%+ confidence
                      </p>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-2xl font-bold">$100<span className="text-base font-normal text-muted-foreground">/mo</span></p>
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
