import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Target, TrendingUp, Users, DollarSign, Plus, BarChart3, Brain } from 'lucide-react';
import { advertiserService, AnalyticsSummary, Campaign } from '../../services/advertiser.service';
import { CampaignManagement } from '../advertiser/CampaignManagement';
import AdvancedAlgorithmsDashboard from './AdvancedAlgorithmsDashboard';
import { useAuth } from '../../App';

export function AdvertiserDashboard() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || 'demo-org';
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignManagement, setShowCampaignManagement] = useState(false);
  const [showAdvancedAlgorithms, setShowAdvancedAlgorithms] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data for org:', organizationId);
      
      const [analyticsData, campaignsData] = await Promise.all([
        advertiserService.getAnalyticsSummary(undefined, undefined, organizationId),
        advertiserService.getCampaigns({ limit: 5 }, organizationId)
      ]);
      
      console.log('📊 Analytics data:', analyticsData);
      console.log('📊 Campaigns data:', campaignsData);
      console.log('📊 Recent campaigns:', campaignsData.campaigns || campaignsData.data);
      
      setAnalytics(analyticsData);
      // Handle both 'data' and 'campaigns' fields for backward compatibility
      const recentCampaignsData = campaignsData.campaigns || campaignsData.data || [];
      setRecentCampaigns(recentCampaignsData);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('💥 Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  if (showCampaignManagement) {
    return (
      <CampaignManagement 
        organizationId={organizationId}
      />
    );
  }

  if (showAdvancedAlgorithms) {
    return (
      <AdvancedAlgorithmsDashboard onBack={() => setShowAdvancedAlgorithms(false)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advertiser Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your advertising campaigns and performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCampaignManagement(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Manage Campaigns
          </Button>
          <Button onClick={() => setShowAdvancedAlgorithms(true)}>
            <Brain className="h-4 w-4 mr-2" />
            Advanced Algorithms
          </Button>
          <Button onClick={() => setShowCampaignManagement(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : analytics?.summary.activeCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${analytics?.summary.totalCampaigns || 0} total campaigns`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatNumber(analytics?.summary.totalImpressions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `CTR: ${(analytics?.summary.overallCTR || 0).toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatNumber(analytics?.summary.totalClicks || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `Conv. Rate: ${(analytics?.summary.overallConversionRate || 0).toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatCurrency(analytics?.summary.totalSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `Budget: ${formatCurrency(analytics?.summary.totalBudget || 0)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CPM</CardTitle>
            <CardDescription>Cost per thousand impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : `$${(analytics?.summary.overallCPM || 0).toFixed(2)}`}
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
              {loading ? '...' : `$${(analytics?.summary.overallCPC || 0).toFixed(2)}`}
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
              {loading ? '...' : `$${(analytics?.summary.overallCPA || 0).toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Your latest campaigns and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading campaigns...</div>
          ) : recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns yet. Create your first campaign to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {campaign.status} • {campaign.type} • {campaign.ads?.length || 0} ads
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(campaign.totalSpent)}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}% CTR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 