import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Eye,
  MousePointer,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Globe,
  Zap
} from 'lucide-react';

interface LiveMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
}

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'revenue' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  affectedCampaigns?: string[];
  affectedPublishers?: string[];
}

interface CampaignMetric {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  revenue: number;
  roas: number;
  status: 'active' | 'paused' | 'completed';
  lastUpdate: string;
}

export function RealTimeDashboard() {
  const [isLive, setIsLive] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([
    {
      id: '1',
      name: 'Live Impressions',
      value: 2456789,
      unit: 'impressions',
      change: 12.5,
      trend: 'up',
      status: 'normal',
      lastUpdate: 'Just now'
    },
    {
      id: '2',
      name: 'Live Clicks',
      value: 156789,
      unit: 'clicks',
      change: 8.3,
      trend: 'up',
      status: 'normal',
      lastUpdate: 'Just now'
    },
    {
      id: '3',
      name: 'Live Revenue',
      value: 45678,
      unit: 'USD',
      change: -2.1,
      trend: 'down',
      status: 'warning',
      lastUpdate: 'Just now'
    },
    {
      id: '4',
      name: 'Active Sessions',
      value: 8923,
      unit: 'sessions',
      change: 5.7,
      trend: 'up',
      status: 'normal',
      lastUpdate: 'Just now'
    }
  ]);

  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([
    {
      id: '1',
      type: 'performance',
      severity: 'high',
      title: 'CTR Drop Detected',
      description: 'Campaign "Summer Sale" CTR dropped by 25% in the last 15 minutes',
      timestamp: '2 minutes ago',
      status: 'active',
      affectedCampaigns: ['Summer Sale Campaign']
    },
    {
      id: '2',
      type: 'revenue',
      severity: 'medium',
      title: 'Revenue Milestone',
      description: 'Daily revenue target of $50,000 achieved',
      timestamp: '5 minutes ago',
      status: 'acknowledged'
    },
    {
      id: '3',
      type: 'system',
      severity: 'low',
      title: 'High API Usage',
      description: 'API call rate increased by 40% in the last hour',
      timestamp: '8 minutes ago',
      status: 'active'
    }
  ]);

  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetric[]>([
    {
      id: '1',
      name: 'Summer Sale Campaign',
      impressions: 2456789,
      clicks: 156789,
      ctr: 6.4,
      spend: 4250,
      revenue: 8900,
      roas: 2.09,
      status: 'active',
      lastUpdate: 'Just now'
    },
    {
      id: '2',
      name: 'Brand Awareness',
      impressions: 1890456,
      clicks: 98765,
      ctr: 5.2,
      spend: 2800,
      revenue: 5600,
      roas: 2.0,
      status: 'active',
      lastUpdate: 'Just now'
    },
    {
      id: '3',
      name: 'Product Launch',
      impressions: 3123456,
      clicks: 198765,
      ctr: 6.4,
      spend: 5400,
      revenue: 11200,
      roas: 2.07,
      status: 'active',
      lastUpdate: 'Just now'
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLiveMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + Math.floor(Math.random() * 1000),
        change: metric.change + (Math.random() - 0.5) * 2,
        lastUpdate: 'Just now'
      })));

      setCampaignMetrics(prev => prev.map(campaign => ({
        ...campaign,
        impressions: campaign.impressions + Math.floor(Math.random() * 1000),
        clicks: campaign.clicks + Math.floor(Math.random() * 100),
        lastUpdate: 'Just now'
      })));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'security':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'system':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Data Dashboard</h1>
          <p className="text-muted-foreground">
            Live monitoring of platform performance and real-time metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isLive ? "default" : "secondary"} className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {isLive ? 'Live Updates' : 'Updates Paused'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {liveMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className="flex items-center gap-2">
                {getTrendIcon(metric.trend)}
                <Badge 
                  variant={metric.status === 'normal' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {metric.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.unit === 'USD' ? formatCurrency(metric.value) : formatNumber(metric.value)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {metric.trend === 'up' ? '+' : ''}{metric.change.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{metric.lastUpdate}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Live Campaign Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Performance Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Real-time Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Campaign Performance</CardTitle>
              <CardDescription>
                Real-time metrics for active advertising campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignMetrics.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{formatNumber(campaign.impressions)}</TableCell>
                      <TableCell>{formatNumber(campaign.clicks)}</TableCell>
                      <TableCell>{campaign.ctr.toFixed(1)}%</TableCell>
                      <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                      <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                      <TableCell>{campaign.roas.toFixed(2)}x</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {campaign.lastUpdate}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>
                Real-time alerts and notifications for performance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceAlerts.map((alert) => (
                  <Alert key={alert.id} className="border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                            <Badge variant="outline">{alert.status}</Badge>
                          </div>
                          <AlertDescription>{alert.description}</AlertDescription>
                          {alert.affectedCampaigns && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-muted-foreground">Affected Campaigns:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.affectedCampaigns.map((campaign) => (
                                  <Badge key={campaign} variant="secondary" className="text-xs">
                                    {campaign}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{alert.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Acknowledge</Button>
                        <Button variant="outline" size="sm">Investigate</Button>
                        <Button variant="outline" size="sm">Resolve</Button>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Live analytics and performance insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Geographic Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Geographic Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">United States</span>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="w-24" />
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Europe</span>
                      <div className="flex items-center gap-2">
                        <Progress value={32} className="w-24" />
                        <span className="text-sm font-medium">32%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Asia Pacific</span>
                      <div className="flex items-center gap-2">
                        <Progress value={18} className="w-24" />
                        <span className="text-sm font-medium">18%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Other</span>
                      <div className="flex items-center gap-2">
                        <Progress value={5} className="w-24" />
                        <span className="text-sm font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Device Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Desktop</span>
                      <div className="flex items-center gap-2">
                        <Progress value={58} className="w-24" />
                        <span className="text-sm font-medium">58%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mobile</span>
                      <div className="flex items-center gap-2">
                        <Progress value={35} className="w-24" />
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tablet</span>
                      <div className="flex items-center gap-2">
                        <Progress value={7} className="w-24" />
                        <span className="text-sm font-medium">7%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Performance Chart */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Performance Trends (Last Hour)</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Real-time performance chart</p>
                    <p className="text-sm">Live data visualization will be implemented here</p>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">45ms</div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1.2K</div>
                  <p className="text-sm text-muted-foreground">Requests/sec</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 