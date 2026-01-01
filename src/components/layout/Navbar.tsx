import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionGate';
import { 
  Building2, 
  Bell, 
  User, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  Scan
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function Navbar() {
  const { user, profile, role, signOut } = useAuth();
  const { isSubscribed, isTrialing, hasAccess } = useSubscription();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showUpgradeButton = user && role === 'investor' && !isSubscribed && !isTrialing;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              QuickLiqi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/marketplace" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Marketplace
                </Link>
                {role === 'investor' && (
                  <>
                    <Link 
                      to="/buy-box" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      My Buy Box
                    </Link>
                    <Link 
                      to="/scraper" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Scan className="h-3.5 w-3.5" />
                      AI Scraper
                    </Link>
                  </>
                )}
                {role === 'wholesaler' && (
                  <Link 
                    to="/my-listings" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    My Listings
                  </Link>
                )}
                <Link 
                  to="/pricing" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/marketplace" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Deals
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Upgrade button for free investors */}
                {showUpgradeButton && (
                  <Button size="sm" asChild className="hidden sm:inline-flex">
                    <Link to="/pricing">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Upgrade
                    </Link>
                  </Button>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {profile?.full_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                        <SubscriptionBadge />
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{role}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/marketplace" 
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Marketplace
                  </Link>
                  {role === 'investor' && (
                    <>
                      <Link 
                        to="/buy-box" 
                        className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Buy Box
                      </Link>
                      <Link 
                        to="/scraper" 
                        className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Scan className="h-3.5 w-3.5" />
                        AI Scraper
                      </Link>
                    </>
                  )}
                  {role === 'wholesaler' && (
                    <Link 
                      to="/my-listings" 
                      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    to="/marketplace" 
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Browse Deals
                  </Link>
                  <Link 
                    to="/auth" 
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}