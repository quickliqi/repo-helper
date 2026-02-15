import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-card py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">QL</span>
                </div>
                <span className="font-display text-xl font-bold text-foreground">QuickLiqi</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm">
                The professional marketplace connecting off-market real estate deals with qualified investors.
                Stop searching. Start matching.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Platform</h4>
              <div className="flex flex-col gap-2">
                <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Marketplace
                </Link>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Learn
                </Link>
                <Link to="/demand" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Demand
                </Link>
                <Link to="/auth?mode=signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <div className="flex flex-col gap-2">
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <a href="mailto:support@quickliqi.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} QuickLiqi. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built for real estate professionals. Founded by Damien Thomas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}