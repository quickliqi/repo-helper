import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface PaymentWithUser {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  user_email?: string;
}

export function AdminPaymentHistory() {
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const { data: paymentsData, error } = await supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user profiles for emails
      if (paymentsData && paymentsData.length > 0) {
        const userIds = [...new Set(paymentsData.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const paymentsWithUsers = paymentsData.map(p => ({
          ...p,
          user_email: profileMap.get(p.user_id) || 'Unknown User',
        }));

        setPayments(paymentsWithUsers);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripe_payment_intent_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((acc, p) => acc + p.amount, 0) / 100;

  const exportCSV = () => {
    const headers = ['Date', 'User', 'Description', 'Amount', 'Status', 'Payment ID'];
    const rows = filteredPayments.map(p => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.user_email,
      p.description || '',
      `$${(p.amount / 100).toFixed(2)}`,
      p.status,
      p.stripe_payment_intent_id || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              {payments.length} total payments · ${totalRevenue.toLocaleString()} revenue
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No payments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      <span className="text-muted-foreground text-xs block">
                        {format(new Date(payment.created_at), 'HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.user_email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.description || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(payment.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
