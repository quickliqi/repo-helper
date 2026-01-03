import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare,
  Search,
  Bell,
  CreditCard
} from 'lucide-react';

export default function Funnel() {
  return (
    <MainLayout>
      <Helmet>
        <title>Start Free - QuickLiqi | Free Trial for Investors, Free Posting for Wholesalers</title>
        <meta name="description" content="Investors: Get 7 days FREE to find off-market deals matched to your buy box. Wholesalers: Post your first deal FREE and find cash buyers in 24 hours." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 text-sm px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              Limited Time Offer - Start 100% Free
            </Badge>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Close More Deals.<br />
              <span className="text-accent">Pay Nothing to Start.</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
              Whether you're hunting for off-market properties or need buyers for your wholesale deals—we've got a free way for you to get started.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl px-8 py-6">
                <a href="#investors">
                  <Target className="mr-2 h-5 w-5" />
                  I'm an Investor
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6">
                <a href="#wholesalers">
                  <Building2 className="mr-2 h-5 w-5" />
                  I'm a Wholesaler
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-secondary py-6 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Active Investors</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">$2M+</p>
              <p className="text-sm text-muted-foreground">Deals Matched</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">24hrs</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-accent">FREE</p>
              <p className="text-sm text-muted-foreground">To Get Started</p>
            </div>
          </div>
        </div>
      </section>

      {/* Investor Section */}
      <section id="investors" className="py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary">
                <Target className="w-4 h-4 mr-2" />
                For Investors
              </Badge>
              
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Get Off-Market Deals Matched to Your <span className="text-primary">Buy Box</span>
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8">
                Stop wasting hours on cold calls and networking events. Our AI matches you with wholesale deals that fit your exact investment criteria—delivered straight to your inbox.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Search, text: 'Deals pre-filtered to your buy box criteria' },
                  { icon: Bell, text: 'Instant notifications when matching deals drop' },
                  { icon: Shield, text: 'Verified wholesalers with real contracts' },
                  { icon: TrendingUp, text: 'ARV, comps, and repair estimates included' },
                  { icon: MessageSquare, text: 'Direct messaging with deal owners' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              <Card className="border-2 border-accent bg-accent/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-8 h-8 text-accent" />
                    <div>
                      <p className="font-bold text-lg text-foreground">7-Day Free Trial</p>
                      <p className="text-sm text-muted-foreground">No credit card required</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Full access to all matching features</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Create unlimited buy boxes</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Contact wholesalers directly</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span>Cancel anytime—no strings attached</span>
                    </li>
                  </ul>
                  <Button size="lg" asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/auth?mode=signup&role=investor">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start My Free 7-Day Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl" />
                <Card className="relative overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-primary text-primary-foreground p-4">
                      <p className="text-sm font-medium">🔔 New Match Found!</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">3BR/2BA Single Family</h3>
                          <p className="text-muted-foreground text-sm">Houston, TX 77002</p>
                        </div>
                        <Badge className="bg-accent/10 text-accent">92% Match</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Asking Price</p>
                          <p className="font-semibold text-lg">$145,000</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ARV</p>
                          <p className="font-semibold text-lg text-primary">$220,000</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Repair Est.</p>
                          <p className="font-semibold">$35,000</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Potential Profit</p>
                          <p className="font-semibold text-accent">$40,000</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Fix & Flip</Badge>
                        <Badge variant="secondary">Fair Condition</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-4">
        <div className="border-t border-border" />
      </div>

      {/* Wholesaler Section */}
      <section id="wholesalers" className="py-20 bg-background scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl blur-2xl" />
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-lg">Your Deal Performance</h3>
                      <Badge className="bg-primary/10 text-primary">Live</Badge>
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-secondary rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">123 Oak Street</span>
                          <Badge className="bg-accent/10 text-accent text-xs">Hot 🔥</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-2xl font-bold text-primary">47</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-primary">12</p>
                            <p className="text-xs text-muted-foreground">Matches</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-accent">5</p>
                            <p className="text-xs text-muted-foreground">Inquiries</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">New buyer inquiry!</p>
                          <p className="text-xs text-muted-foreground">"I'm interested in 123 Oak St..."</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-accent/10 text-accent">
                <Building2 className="w-4 h-4 mr-2" />
                For Wholesalers
              </Badge>
              
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                Find Cash Buyers in <span className="text-accent">24 Hours</span>—Not Weeks
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8">
                Stop cold calling and begging for buyers. Post your deal once, and we instantly match it with verified investors who are actively looking for exactly what you have.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Zap, text: 'Instant matching with active cash buyers' },
                  { icon: Users, text: 'Access to 500+ verified investors' },
                  { icon: Clock, text: 'First inquiries typically within 24 hours' },
                  { icon: DollarSign, text: 'No monthly fees—pay per listing only' },
                  { icon: Star, text: 'Priority placement for your deals' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              <Card className="border-2 border-primary bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-bold text-lg text-foreground">1 Free Posting Credit</p>
                      <p className="text-sm text-muted-foreground">Post your first deal 100% free</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>No credit card needed to sign up</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Your deal matched with qualified buyers</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>See real interest before you pay</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Additional listings just $10 each</span>
                    </li>
                  </ul>
                  <Button size="lg" asChild className="w-full">
                    <Link to="/auth?mode=signup&role=wholesaler">
                      <Gift className="mr-2 h-5 w-5" />
                      Claim My Free Posting Credit
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why QuickLiqi vs. The Old Way?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real estate moves fast. Your deal-finding should too.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-destructive">❌ The Old Way</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>Cold calling for hours to find buyers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>Scrolling endless Facebook groups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>Paying for lists that are outdated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>Networking events with no ROI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>Deals expiring before you find a buyer</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-primary">✓ The QuickLiqi Way</h3>
                <ul className="space-y-3 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>AI matches deals to active buyers instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Verified investors, not tire-kickers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Pay only for what works</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Direct messaging—no gatekeepers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>First responses in 24 hours, not weeks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "Posted my first deal on a Friday, had 3 serious buyers by Monday. The free credit let me test without risk.",
                name: "Marcus T.",
                role: "Wholesaler, Atlanta",
                type: "wholesaler"
              },
              {
                quote: "The trial convinced me in 2 days. Found two properties that matched my buy box perfectly. Already closed one.",
                name: "Sarah K.",
                role: "Fix & Flip Investor, Dallas",
                type: "investor"
              },
              {
                quote: "No more cold calling. No more networking events. Just deals that match what I'm looking for. Worth every penny.",
                name: "James R.",
                role: "BRRRR Investor, Houston",
                type: "investor"
              }
            ].map((testimonial, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Close More Deals?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of real estate professionals who stopped searching and started matching.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild className="text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl px-8 py-6">
              <Link to="/auth?mode=signup&role=investor">
                <Timer className="mr-2 h-5 w-5" />
                Start 7-Day Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6">
              <Link to="/auth?mode=signup&role=wholesaler">
                <Gift className="mr-2 h-5 w-5" />
                Get Free Posting Credit
              </Link>
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/70">
            No credit card required • Cancel anytime • Start in under 2 minutes
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
