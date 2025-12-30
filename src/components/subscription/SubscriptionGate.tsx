import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, CreditCard, Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Gate for investors - requires active subscription or trial
export function SubscriptionRequired({ children, fallback }: SubscriptionGateProps) {
  const { isSubscribed, isTrialing, isLoading } = useSubscription();
  const { role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only gate investors
  if (role !== 'investor') {
    return <>{children}</>;
  }

  if (isSubscribed || isTrialing) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt type="investor" />;
}

// Gate for wholesalers - requires listing credits
export function CreditsRequired({ children, fallback }: SubscriptionGateProps) {
  const { listingCredits, isLoading } = useSubscription();
  const { role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only gate wholesalers
  if (role !== 'wholesaler') {
    return <>{children}</>;
  }

  if (listingCredits > 0) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt type="wholesaler" />;
}

interface UpgradePromptProps {
  type: 'investor' | 'wholesaler';
  compact?: boolean;
}

export function UpgradePrompt({ type, compact = false }: UpgradePromptProps) {
  if (type === 'investor') {
    return (
      <Card className={`border-primary/20 ${compact ? '' : 'max-w-md mx-auto'}`}>
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Upgrade to Access</CardTitle>
          <CardDescription>
            Start your 7-day free trial to unlock property matches and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Unlimited property matches</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Direct wholesaler contact</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Real-time notifications</span>
            </li>
          </ul>
          <Button asChild className="w-full">
            <Link to="/pricing">
              Start Free Trial - $49/mo
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. 7-day money-back guarantee.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-accent/20 ${compact ? '' : 'max-w-md mx-auto'}`}>
      <CardHeader className="text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <CreditCard className="h-6 w-6 text-accent" />
        </div>
        <CardTitle className="text-xl">Credits Required</CardTitle>
        <CardDescription>
          Purchase listing credits to post your deals on the marketplace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-accent/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-accent">$10</p>
          <p className="text-sm text-muted-foreground">per listing credit</p>
        </div>
        <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          <Link to="/pricing">
            Buy Credits
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Credits never expire
        </p>
      </CardContent>
    </Card>
  );
}

// Inline badge showing subscription status
export function SubscriptionBadge() {
  const { isSubscribed, isTrialing, listingCredits, isLoading } = useSubscription();
  const { role } = useAuth();

  if (isLoading) return null;

  if (role === 'investor') {
    if (isTrialing) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Trial Active</Badge>;
    }
    if (isSubscribed) {
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Pro</Badge>;
    }
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Free</Badge>;
  }

  if (role === 'wholesaler') {
    return (
      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
        {listingCredits} credit{listingCredits !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return null;
}
