import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  status: string;
  plan_type: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  user_name?: string;
}

interface ScrapeSubscription {
  id: string;
  user_id: string;
  credits_remaining: number;
  credits_used: number;
  subscription_active: boolean;
  current_period_end: string | null;
  created_at: string;
  user_name?: string;
}

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [scrapeSubscriptions, setScrapeSubscriptions] = useState<ScrapeSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      // Fetch investor subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Fetch scrape subscriptions
      const { data: scrapeData, error: scrapeError } = await supabase
        .from('scrape_credits')
        .select('*')
        .order('created_at', { ascending: false });

      if (scrapeError) throw scrapeError;

      // Get all user IDs
      const allUserIds = [
        ...new Set([
          ...(subsData?.map(s => s.user_id) || []),
          ...(scrapeData?.map(s => s.user_id) || []),
        ])
      ];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Map subscriptions with user names
      const subsWithUsers = (subsData || []).map(s => ({
        ...s,
        user_name: profileMap.get(s.user_id) || 'Unknown User',
      }));

      const scrapeWithUsers = (scrapeData || []).map(s => ({
        ...s,
        user_name: profileMap.get(s.user_id) || 'Unknown User',
      }));

      setSubscriptions(subsWithUsers);
      setScrapeSubscriptions(scrapeWithUsers);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScrapeSubscriptions = scrapeSubscriptions.filter(sub =>
    sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'trialing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'canceled':
        return 'bg-muted text-muted-foreground';
      case 'past_due':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const activeCount = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const activeScrapeCount = scrapeSubscriptions.filter(s => s.subscription_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="investor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="investor">
            Investor Pro ({activeCount} active)
          </TabsTrigger>
          <TabsTrigger value="scraper">
            Scraper Pro ({activeScrapeCount} active)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investor">
          <Card>
            <CardHeader>
              <CardTitle>Investor Pro Subscriptions</CardTitle>
              <CardDescription>
                {subscriptions.length} total subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No subscriptions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Period End</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {sub.user_name}
                          </TableCell>
                          <TableCell className="capitalize">
                            {sub.plan_type?.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(sub.status)}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.current_period_end 
                              ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(sub.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scraper">
          <Card>
            <CardHeader>
              <CardTitle>Scraper Pro Subscriptions</CardTitle>
              <CardDescription>
                {scrapeSubscriptions.length} total subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredScrapeSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No scraper subscriptions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Credits Used</TableHead>
                        <TableHead className="text-right">Credits Left</TableHead>
                        <TableHead>Period End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredScrapeSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {sub.user_name}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={sub.subscription_active 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                : 'bg-muted text-muted-foreground'
                              }
                            >
                              {sub.subscription_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {sub.credits_used}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {sub.credits_remaining}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.current_period_end 
                              ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
