import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Building2, DollarSign, Activity, Target } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DailyStats {
  date: string;
  signups: number;
  properties: number;
  revenue: number;
}

interface RoleDistribution {
  name: string;
  value: number;
  color: string;
}

export function AdminAnalytics() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [propertyStats, setPropertyStats] = useState<{ type: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      // Fetch user roles for signups over time
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role, created_at');

      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('property_type, created_at');

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payment_history')
        .select('amount, created_at, status')
        .eq('status', 'succeeded');

      // Calculate daily stats
      const dailyStatsMap = new Map<string, DailyStats>();
      
      last30Days.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        dailyStatsMap.set(dateStr, {
          date: format(date, 'MMM d'),
          signups: 0,
          properties: 0,
          revenue: 0,
        });
      });

      // Count signups per day
      rolesData?.forEach(role => {
        const dateStr = format(new Date(role.created_at), 'yyyy-MM-dd');
        const stats = dailyStatsMap.get(dateStr);
        if (stats) {
          stats.signups += 1;
        }
      });

      // Count properties per day
      propertiesData?.forEach(prop => {
        const dateStr = format(new Date(prop.created_at), 'yyyy-MM-dd');
        const stats = dailyStatsMap.get(dateStr);
        if (stats) {
          stats.properties += 1;
        }
      });

      // Sum revenue per day
      paymentsData?.forEach(payment => {
        const dateStr = format(new Date(payment.created_at), 'yyyy-MM-dd');
        const stats = dailyStatsMap.get(dateStr);
        if (stats) {
          stats.revenue += payment.amount / 100;
        }
      });

      setDailyStats(Array.from(dailyStatsMap.values()));

      // Calculate role distribution
      const roleCounts = { investor: 0, wholesaler: 0, admin: 0 };
      rolesData?.forEach(r => {
        if (r.role in roleCounts) {
          roleCounts[r.role as keyof typeof roleCounts] += 1;
        }
      });

      setRoleDistribution([
        { name: 'Investors', value: roleCounts.investor, color: 'hsl(var(--chart-1))' },
        { name: 'Wholesalers', value: roleCounts.wholesaler, color: 'hsl(var(--chart-2))' },
        { name: 'Admins', value: roleCounts.admin, color: 'hsl(var(--chart-3))' },
      ]);

      // Calculate property type distribution
      const propTypeCounts: Record<string, number> = {};
      propertiesData?.forEach(p => {
        const type = p.property_type?.replace('_', ' ') || 'other';
        propTypeCounts[type] = (propTypeCounts[type] || 0) + 1;
      });

      setPropertyStats(
        Object.entries(propTypeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      );

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSignups = dailyStats.reduce((acc, d) => acc + d.signups, 0);
  const totalProperties = dailyStats.reduce((acc, d) => acc + d.properties, 0);
  const totalRevenue = dailyStats.reduce((acc, d) => acc + d.revenue, 0);

  const chartConfig = {
    signups: {
      label: "Signups",
      color: "hsl(var(--chart-1))",
    },
    properties: {
      label: "Properties",
      color: "hsl(var(--chart-2))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signups (30 days)
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSignups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Properties Listed (30 days)
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (30 days)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Signups
            </CardTitle>
            <CardDescription>New user registrations over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="signupsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#signupsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue
            </CardTitle>
            <CardDescription>Daily revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              User Roles
            </CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {roleDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Property Types
            </CardTitle>
            <CardDescription>Distribution of listings by property type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={propertyStats} layout="vertical">
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="type" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--chart-2))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
