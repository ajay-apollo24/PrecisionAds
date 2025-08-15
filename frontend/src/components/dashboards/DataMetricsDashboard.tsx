import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { 
  Building2, 
  Users, 
  Key, 
  TrendingUp, 
  Target, 
  Globe, 
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface MetricData {
  totalOrganizations: number;
  totalUsers: number;
  activeApiKeys: number;
  platformRevenue: number;
  campaignPerformance: {
    active: number;
    total: number;
    avgCTR: number;
    avgCPC: number;
  };
  publisherEarnings: {
    total: number;
    activePublishers: number;
    avgRevenue: number;
  };
}

export function DataMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricData>({
    totalOrganizations: 24,
    totalUsers: 1234,
    activeApiKeys: 89,
    platformRevenue: 45231,
    campaignPerformance: {
      active: 156,
      total: 234,
      avgCTR: 3.2,
      avgCPC: 2.45
    },
    publisherEarnings: {
      total: 15678,
      activePublishers: 18,
      avgRevenue: 871
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        platformRevenue: prev.platformRevenue + Math.floor(Math.random() * 100),
        campaignPerformance: {
          ...prev.campaignPerformance,
          avgCTR: prev.campaignPerformance.avgCTR + (Math.random() - 0.5) * 0.1
        }
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics and performance metrics
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Updates
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalOrganizations)}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeApiKeys)}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last month
            </p>
            <Progress value={82} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.platformRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
            <Progress value={88} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="publishers">Publisher Earnings</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Summary</CardTitle>
              <CardDescription>
                Overview of advertising campaign metrics and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.campaignPerformance.active}</div>
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.campaignPerformance.total}</div>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{metrics.campaignPerformance.avgCTR}%</div>
                  <p className="text-sm text-muted-foreground">Avg CTR</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.campaignPerformance.avgCPC)}</div>
                  <p className="text-sm text-muted-foreground">Avg CPC</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Summer Sale Campaign</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>2.4M</TableCell>
                    <TableCell>4.2%</TableCell>
                    <TableCell>{formatCurrency(4250)}</TableCell>
                    <TableCell><Progress value={85} className="w-20" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Brand Awareness</TableCell>
                    <TableCell><Badge variant="secondary">Paused</Badge></TableCell>
                    <TableCell>1.8M</TableCell>
                    <TableCell>3.1%</TableCell>
                    <TableCell>{formatCurrency(2800)}</TableCell>
                    <TableCell><Progress value={62} className="w-20" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Product Launch</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>3.1M</TableCell>
                    <TableCell>5.8%</TableCell>
                    <TableCell>{formatCurrency(5400)}</TableCell>
                    <TableCell><Progress value={92} className="w-20" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Earnings Summary</CardTitle>
              <CardDescription>
                Overview of publisher performance and revenue metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.publisherEarnings.total)}</div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.publisherEarnings.activePublishers}</div>
                  <p className="text-sm text-muted-foreground">Active Publishers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.publisherEarnings.avgRevenue)}</div>
                  <p className="text-sm text-muted-foreground">Avg Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">156K</div>
                  <p className="text-sm text-muted-foreground">Total Page Views</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publisher Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ad Units</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>TechBlog.com</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>6</TableCell>
                    <TableCell>45K</TableCell>
                    <TableCell>{formatCurrency(1250)}</TableCell>
                    <TableCell><Progress value={78} className="w-20" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>LifestyleMag.net</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>32K</TableCell>
                    <TableCell>{formatCurrency(890)}</TableCell>
                    <TableCell><Progress value={65} className="w-20" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NewsPortal.org</TableCell>
                    <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>67K</TableCell>
                    <TableCell>{formatCurrency(1100)}</TableCell>
                    <TableCell><Progress value={45} className="w-20" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Metrics</CardTitle>
              <CardDescription>
                Live updates of platform performance and key indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">2.4M</div>
                  <p className="text-sm text-muted-foreground">Live Impressions</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">156K</div>
                  <p className="text-sm text-muted-foreground">Live Clicks</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">$1,234</div>
                  <p className="text-sm text-muted-foreground">Live Revenue</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">89</div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Alerts</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium">High CTR Alert</p>
                      <p className="text-sm text-muted-foreground">Campaign "Summer Sale" CTR increased by 15%</p>
                    </div>
                    <Badge variant="outline">2 min ago</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Revenue Milestone</p>
                      <p className="text-sm text-muted-foreground">Daily revenue target achieved</p>
                    </div>
                    <Badge variant="outline">5 min ago</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Campaign Ending</p>
                      <p className="text-sm text-muted-foreground">"Brand Awareness" campaign ends in 2 hours</p>
                    </div>
                    <Badge variant="outline">10 min ago</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 