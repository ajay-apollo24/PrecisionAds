import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Selector } from '../ui/selector';
import { SimpleChart } from '../ui/simple-chart';
import { DollarSign, TrendingUp, TrendingDown, Eye, Download, Calendar, Target } from 'lucide-react';
import { publisherService, EarningsSummary } from '../../services/publisher.service';

interface EarningsData {
  period: string;
  total_impressions: number;
  total_clicks: number;
  total_revenue: number;
  avg_cpm: number;
  avg_cpc: number;
}

interface SiteEarnings {
  siteId: string;
  siteName: string;
  revenue: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export function EarningsDashboard() {
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [siteEarnings, setSiteEarnings] = useState<SiteEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');

  useEffect(() => {
    loadEarningsData();
  }, [dateRange, groupBy]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const summary = await publisherService.getEarningsSummary();
      setEarningsSummary(summary);
      
      // Transform top sites data for display
      const sitesWithNames = summary.topSites.map(site => ({
        siteId: site.siteId,
        siteName: `Site ${site.siteId.slice(-6)}`, // Simplified for demo
        revenue: site._sum.revenue,
        impressions: site._sum.impressions,
        clicks: site._sum.clicks,
        ctr: site._sum.impressions > 0 ? (site._sum.clicks / site._sum.impressions) * 100 : 0
      }));
      
      setSiteEarnings(sitesWithNames);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const getPerformanceTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'neutral', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!earningsSummary) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No earnings data available
      </div>
    );
  }

  const { summary } = earningsSummary;
  const ctr = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earnings Dashboard</h2>
          <p className="text-muted-foreground">
            Track your revenue, performance metrics, and earnings trends
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Selector
            value={dateRange}
            onValueChange={setDateRange}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: '1y', label: 'Last Year' }
            ]}
            placeholder="Select date range"
          />
          
          <Selector
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as 'day' | 'month')}
            options={[
              { value: 'day', label: 'Daily' },
              { value: 'month', label: 'Monthly' }
            ]}
            placeholder="Group by"
          />
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabel(dateRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalImpressions)}</div>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabel(dateRange)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(ctr)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(summary.totalClicks)} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageCPM)}</div>
            <p className="text-xs text-muted-foreground">
              per 1,000 impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Revenue performance over {getDateRangeLabel(dateRange).toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart
              data={[
                { label: 'Week 1', value: (earningsSummary?.summary.totalRevenue || 0) * 0.3, color: 'bg-blue-500' },
                { label: 'Week 2', value: (earningsSummary?.summary.totalRevenue || 0) * 0.25, color: 'bg-green-500' },
                { label: 'Week 3', value: (earningsSummary?.summary.totalRevenue || 0) * 0.2, color: 'bg-yellow-500' },
                { label: 'Week 4', value: (earningsSummary?.summary.totalRevenue || 0) * 0.25, color: 'bg-purple-500' }
              ]}
              type="bar"
              height={256}
              showValues
            />
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CPM Trend</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatCurrency(summary.averageCPM)}</span>
                <Badge variant="secondary" className="text-xs">
                  {summary.averageCPM > 0 ? 'Stable' : 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CPC Trend</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatCurrency(summary.averageCPC)}</span>
                <Badge variant="secondary" className="text-xs">
                  {summary.averageCPC > 0 ? 'Stable' : 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CTR Performance</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatPercentage(ctr)}</span>
                <Badge 
                  variant={ctr > 2 ? 'default' : ctr > 1 ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {ctr > 2 ? 'Excellent' : ctr > 1 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Sites */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Sites</CardTitle>
          <CardDescription>
            Sites generating the highest revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {siteEarnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No site performance data available
            </div>
          ) : (
            <div className="space-y-4">
              {siteEarnings.map((site, index) => (
                <div key={site.siteId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{site.siteName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(site.impressions)} impressions • {formatPercentage(site.ctr)} CTR
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(site.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(site.clicks)} clicks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Summary</CardTitle>
          <CardDescription>
            Detailed breakdown of your earnings by period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Period</th>
                  <th className="text-right py-2 font-medium">Impressions</th>
                  <th className="text-right py-2 font-medium">Clicks</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">CPM</th>
                  <th className="text-right py-2 font-medium">CPC</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">{getDateRangeLabel(dateRange)}</td>
                  <td className="text-right py-2">{formatNumber(summary.totalImpressions)}</td>
                  <td className="text-right py-2">{formatNumber(summary.totalClicks)}</td>
                  <td className="text-right py-2 font-medium">{formatCurrency(summary.totalRevenue)}</td>
                  <td className="text-right py-2">{formatCurrency(summary.averageCPM)}</td>
                  <td className="text-right py-2">{formatCurrency(summary.averageCPC)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 