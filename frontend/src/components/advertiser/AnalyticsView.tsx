import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Selector } from '../ui/selector';
import { advertiserService, AnalyticsSummary, CampaignAnalytics } from '../../services/advertiser.service';
import { TrendingUp, BarChart3, Target, DollarSign } from 'lucide-react';

interface AnalyticsViewProps {
  organizationId: string;
}

export function AnalyticsView({ organizationId }: AnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      
      const analyticsData = await advertiserService.getAnalyticsSummary(startDate, endDate, organizationId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      
      const analytics = await advertiserService.getCampaignAnalytics(campaignId, startDate, endDate);
      setCampaignAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load campaign analytics:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Campaign performance insights and metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Selector
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' }
            ]}
          />
        </div>
      </div>

      {/* Overview Metrics */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.summary.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.totalImpressions)}</div>
              <p className="text-xs text-muted-foreground">
                CTR: {analytics.summary.overallCTR.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.totalClicks)}</div>
              <p className="text-xs text-muted-foreground">
                Conv. Rate: {analytics.summary.overallConversionRate.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.summary.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                Budget: {formatCurrency(analytics.summary.totalBudget)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPM</CardTitle>
              <CardDescription>Cost per thousand impressions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(analytics.summary.overallCPM || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPC</CardTitle>
              <CardDescription>Cost per click</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(analytics.summary.overallCPC || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPA</CardTitle>
              <CardDescription>Cost per acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(analytics.summary.overallCPA || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performing Campaigns */}
      {analytics?.topCampaigns && analytics.topCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
            <CardDescription>
              Your best performing campaigns by clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {campaign.clicks.toLocaleString()} clicks • {campaign.impressions.toLocaleString()} impressions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{campaign.ctr.toFixed(2)}% CTR</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(campaign.spent)} spent
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Analytics */}
      {campaignAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance: {campaignAnalytics.campaign.name}</CardTitle>
            <CardDescription>
              Detailed performance metrics for selected campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Performance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div>Impressions: {campaignAnalytics.performance.impressions.toLocaleString()}</div>
                  <div>Clicks: {campaignAnalytics.performance.clicks.toLocaleString()}</div>
                  <div>Conversions: {campaignAnalytics.performance.conversions.toLocaleString()}</div>
                  <div>CTR: {campaignAnalytics.performance.ctr.toFixed(2)}%</div>
                  <div>Conversion Rate: {campaignAnalytics.performance.conversionRate.toFixed(2)}%</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cost Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div>CPM: ${campaignAnalytics.performance.cpm.toFixed(2)}</div>
                  <div>CPC: ${campaignAnalytics.performance.cpc.toFixed(2)}</div>
                  <div>CPA: ${campaignAnalytics.performance.cpa.toFixed(2)}</div>
                  <div>Budget Utilization: {campaignAnalytics.campaign.budgetUtilization.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!analytics && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 