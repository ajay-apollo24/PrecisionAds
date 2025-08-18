import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { apiService } from '../../services/api.service';

interface PerformanceMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  conversionRate: number;
  roas: number;
}

interface AnalyticsData {
  performanceData: any[];
  aggregated: PerformanceMetrics;
  summary: PerformanceMetrics;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, groupBy]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/analytics-reporting/performance', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          groupBy,
        },
      });
      
      setAnalyticsData(response.data);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your advertising performance and insights</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading}>
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} disabled={loading} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Badge variant="secondary">Total</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analyticsData.aggregated.totalImpressions)}
              </div>
              <Progress value={analyticsData.aggregated.avgCTR} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                CTR: {formatPercentage(analyticsData.aggregated.avgCTR)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <Badge variant="secondary">Total</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analyticsData.aggregated.totalClicks)}
              </div>
              <Progress value={analyticsData.aggregated.conversionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Conversion Rate: {formatPercentage(analyticsData.aggregated.conversionRate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Badge variant="secondary">Total</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData.aggregated.totalRevenue)}
              </div>
              <Progress value={Math.min(analyticsData.aggregated.roas * 100, 100)} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                ROAS: {analyticsData.aggregated.roas.toFixed(2)}x
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Metrics</CardTitle>
              <Badge variant="secondary">Avg</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData.aggregated.avgCPC)}
              </div>
              <p className="text-xs text-muted-foreground">
                CPC • CPM: {formatCurrency(analyticsData.aggregated.avgCPM)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      {analyticsData && (
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performanceData.slice(0, 10).map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">
                            {data.period ? new Date(data.period).toLocaleDateString() : `Period ${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatNumber(data.impressions || data.total_impressions || 0)} impressions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatNumber(data.clicks || data.total_clicks || 0)} clicks
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(data.revenue || data.total_revenue || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">CTR Trend</h4>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-500">Chart placeholder</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Conversion Rate Trend</h4>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-500">Chart placeholder</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Top Performing Periods</h4>
                      <div className="space-y-2">
                        {analyticsData.performanceData
                          .sort((a, b) => (b.revenue || b.total_revenue || 0) - (a.revenue || a.total_revenue || 0))
                          .slice(0, 3)
                          .map((data, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Period {index + 1}</span>
                              <span className="font-medium">
                                {formatCurrency(data.revenue || data.total_revenue || 0)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Efficiency Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Avg CPC:</span>
                          <span>{formatCurrency(analyticsData.aggregated.avgCPC)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg CPM:</span>
                          <span>{formatCurrency(analyticsData.aggregated.avgCPM)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ROAS:</span>
                          <span>{analyticsData.aggregated.roas.toFixed(2)}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 