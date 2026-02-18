import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  CreditCard,
  TrendingUp,
  Building2,
  DollarSign,
  Activity,
  Loader2,
  ShieldCheck,
  Shield,
  Mail,
  Settings,
  ToggleLeft,
  UserCog,
  Zap
} from 'lucide-react';
import { AdminPaymentHistory } from '@/components/admin/AdminPaymentHistory';
import { AdminSubscriptions } from '@/components/admin/AdminSubscriptions';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminVerifications } from '@/components/admin/AdminVerifications';
import { AdminEmailTesting } from '@/components/admin/AdminEmailTesting';
import { GovernanceControls } from '@/components/admin/GovernanceControls';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { ScraperCommandCenter } from '@/components/admin/ScraperCommandCenter';
import { AdminStripeControls } from '@/components/admin/AdminStripeControls';
import { AdminContractsPanel } from '@/components/admin/AdminContractsPanel';
import { FileText } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalInvestors: number;
  totalWholesalers: number;
  totalProperties: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export default function Admin() {
  const { user, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalInvestors: 0,
    totalWholesalers: 0,
    totalProperties: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (role === 'admin') {
      fetchStats();
    }
  }, [role]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch user counts by role
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const investors = rolesData?.filter(r => r.role === 'investor').length || 0;
      const wholesalers = rolesData?.filter(r => r.role === 'wholesaler').length || 0;

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Fetch active subscriptions
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']);

      // Fetch total revenue
      const { data: paymentsData } = await supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'succeeded');

      const totalRevenue = paymentsData?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

      setStats({
        totalUsers: (rolesData?.length || 0),
        totalInvestors: investors,
        totalWholesalers: wholesalers,
        totalProperties: propertiesCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (role !== 'admin' && !authLoading)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Platform analytics, user management, and governance controls
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Investors</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalInvestors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Wholesalers</CardTitle>
                <Building2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalWholesalers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalProperties}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Subs</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.activeSubscriptions}</div>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ${isLoading ? '...' : stats.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="flex w-full flex-wrap justify-start gap-2 h-auto p-2">
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Users & Roles</span>
              </TabsTrigger>
              <TabsTrigger value="governance" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Governance</span>
              </TabsTrigger>
              <TabsTrigger value="flags" className="gap-2">
                <ToggleLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Feature Flags</span>
              </TabsTrigger>
              <TabsTrigger value="scraper" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Scraper Health</span>
              </TabsTrigger>
              <TabsTrigger value="verifications" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Verifications</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Subscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Emails</span>
              </TabsTrigger>
              <TabsTrigger value="stripe" className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Stripe</span>
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Contracts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <AdminAnalytics />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="governance">
              <GovernanceControls />
            </TabsContent>

            <TabsContent value="flags">
              <FeatureFlagManager />
            </TabsContent>

            <TabsContent value="scraper">
              <ScraperCommandCenter />
            </TabsContent>

            <TabsContent value="verifications">
              <AdminVerifications />
            </TabsContent>

            <TabsContent value="subscriptions">
              <AdminSubscriptions />
            </TabsContent>

            <TabsContent value="payments">
              <AdminPaymentHistory />
            </TabsContent>

            <TabsContent value="emails">
              <AdminEmailTesting />
            </TabsContent>

            <TabsContent value="stripe">
              <AdminStripeControls />
            </TabsContent>

            <TabsContent value="contracts">
              <AdminContractsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
