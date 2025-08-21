import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Selector } from '../ui/selector';
import { 
  Globe, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Target,
  Calendar,
  Download,
  BarChart3,
  Activity
} from 'lucide-react';
import { publisherService, PublisherSite, SiteStats } from '../../services/publisher.service';
import { EarningsDashboard } from './EarningsDashboard';
import { AdRequestAnalytics } from './AdRequestAnalytics';

interface SiteAnalyticsProps {
  siteId?: string;
  siteName?: string;
}

export function SiteAnalytics({ siteId, siteName }: SiteAnalyticsProps) {
  const [site, setSite] = useState<PublisherSite | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (siteId) {
      loadSiteData();
    }
  }, [siteId, dateRange]);

  const loadSiteData = async () => {
    if (!siteId) return;
    
    try {
      setLoading(true);
      const [siteData, statsData] = await Promise.all([
        publisherService.getSiteById(siteId),
        publisherService.getSiteStats(siteId)
      ]);
      
      setSite(siteData);
      setSiteStats(statsData);
    } catch (error) {
      console.error('Failed to load site data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'INACTIVE': return 'bg-gray-500';
      case 'SUSPENDED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!site || !siteStats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Site not found or no data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{site.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-muted-foreground">{site.domain}</p>
              <Badge className={getStatusColor(site.status)}>
                {site.status}
              </Badge>
            </div>
          </div>
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
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(siteStats.totalRevenue)}</div>
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
            <div className="text-2xl font-bold">{formatNumber(siteStats.totalImpressions)}</div>
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
            <div className="text-2xl font-bold">{formatPercentage(siteStats.ctr)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(siteStats.totalClicks)} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ad Units</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteStats.activeAdUnits}</div>
            <p className="text-xs text-muted-foreground">
              of {site.adUnits.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Site Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Site Overview</CardTitle>
          <CardDescription>
            General information and performance summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Site Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="font-medium">{site.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(site.status)}>
                    {site.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Performance Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ad Requests:</span>
                  <span className="font-medium">{formatNumber(siteStats.totalAdRequests)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fill Rate:</span>
                  <span className="font-medium">
                    {siteStats.totalAdRequests > 0 
                      ? `${((siteStats.totalImpressions / siteStats.totalAdRequests) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue per Request:</span>
                  <span className="font-medium">
                    {siteStats.totalAdRequests > 0 
                      ? formatCurrency(siteStats.totalRevenue / siteStats.totalAdRequests)
                      : '$0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue per Impression:</span>
                  <span className="font-medium">
                    {siteStats.totalImpressions > 0 
                      ? formatCurrency(siteStats.totalRevenue / siteStats.totalImpressions)
                      : '$0.00'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Explore earnings, performance, and ad request data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="requests">Ad Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(siteStats.totalRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(siteStats.totalImpressions)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Impressions</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercentage(siteStats.ctr)}
                    </div>
                    <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div>
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>Site created and configured</span>
                      <span className="text-muted-foreground">
                        {new Date(site.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {site.adUnits.length > 0 && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{site.adUnits.length} ad units configured</span>
                        <span className="text-muted-foreground">Active</span>
                      </div>
                    )}
                    {siteStats.totalImpressions > 0 && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>First ad impressions served</span>
                        <span className="text-muted-foreground">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="earnings" className="mt-6">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Detailed earnings analytics for {site.name}
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/publisher/earnings?siteId=${siteId}`, '_blank')}
                  >
                    View Full Earnings Dashboard
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="requests" className="mt-6">
              <AdRequestAnalytics siteId={siteId} siteName={site.name} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 