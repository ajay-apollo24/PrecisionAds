import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
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
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { dashboardService, DashboardMetrics, Organization, User, APIKey } from '../../services/dashboard.service';
import { toast } from '../ui/sonner';

export function DataMetricsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrganizations: 0,
    totalUsers: 0,
    activeApiKeys: 0,
    platformRevenue: 0,
    campaignPerformance: {
      active: 0,
      total: 0,
      avgCTR: 0,
      avgCPC: 0
    },
    publisherEarnings: {
      total: 0,
      activePublishers: 0,
      avgRevenue: 0
    }
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [
        metricsData,
        organizationsData,
        usersData,
        apiKeysData
      ] = await Promise.all([
        dashboardService.refreshMetrics(),
        dashboardService.getOrganizations(),
        dashboardService.getUsers(),
        dashboardService.getAPIKeys()
      ]);

      setMetrics(metricsData);
      setOrganizations(organizationsData);
      setUsers(usersData);
      setApiKeys(apiKeysData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh metrics
  const refreshMetrics = async () => {
    try {
      setIsRefreshing(true);
      const newMetrics = await dashboardService.refreshMetrics();
      setMetrics(newMetrics);
      toast.success('Metrics refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      toast.error('Failed to refresh metrics');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simulate real-time updates (only for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        setMetrics(prev => ({
          ...prev,
          platformRevenue: prev.platformRevenue + Math.floor(Math.random() * 50),
          campaignPerformance: {
            ...prev.campaignPerformance,
            avgCTR: Math.max(0, prev.campaignPerformance.avgCTR + (Math.random() - 0.5) * 0.1)
          }
        }));
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Updates
          </Badge>
        </div>
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
              {organizations.filter(org => org.status === 'ACTIVE').length} active
            </p>
            <Progress 
              value={(organizations.filter(org => org.status === 'ACTIVE').length / Math.max(metrics.totalOrganizations, 1)) * 100} 
              className="mt-2" 
            />
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
              {users.filter(user => user.status === 'ACTIVE').length} active
            </p>
            <Progress 
              value={(users.filter(user => user.status === 'ACTIVE').length / Math.max(metrics.totalUsers, 1)) * 100} 
              className="mt-2" 
            />
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
              {apiKeys.filter(key => key.status === 'ACTIVE').length} of {apiKeys.length} total
            </p>
            <Progress 
              value={(apiKeys.filter(key => key.status === 'ACTIVE').length / Math.max(apiKeys.length, 1)) * 100} 
              className="mt-2" 
            />
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
              Monthly recurring revenue
            </p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="publishers">Publisher Earnings</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
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
                  <div className="text-2xl font-bold text-purple-600">{metrics.campaignPerformance.avgCTR.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Avg CTR</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.campaignPerformance.avgCPC)}</div>
                  <p className="text-sm text-muted-foreground">Avg CPC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Earnings Overview</CardTitle>
              <CardDescription>
                Revenue distribution and performance across publisher organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organizations Overview</CardTitle>
              <CardDescription>
                All organizations in the platform with their status and type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.orgType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {org.status === 'ACTIVE' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users Overview</CardTitle>
              <CardDescription>
                All users in the platform with their roles and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {user.status === 'ACTIVE' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.organizationName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apikeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Overview</CardTitle>
              <CardDescription>
                All API keys with their permissions and usage status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>{key.userName}</TableCell>
                      <TableCell>{key.organizationName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={key.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {key.status === 'ACTIVE' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.slice(0, 3).map((permission, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {key.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{key.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 