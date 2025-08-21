import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Selector } from '../ui/selector';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Download
} from 'lucide-react';
import { publisherService } from '../../services/publisher.service';

interface AdRequest {
  id: string;
  siteId: string;
  adUnitId: string;
  requestId: string;
  status: string;
  servedAdId?: string;
  bidAmount?: number;
  cpm?: number;
  clickThrough: boolean;
  impression: boolean;
  createdAt: string;
  updatedAt: string;
  adUnit?: {
    name: string;
    size: string;
    format: string;
  };
}

interface AdRequestStats {
  stats: Array<{
    status: string;
    _count: { status: number };
  }>;
  summary: {
    totalRequests: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
  };
}

interface AdRequestAnalyticsProps {
  siteId?: string;
  siteName?: string;
}

export function AdRequestAnalytics({ siteId, siteName }: AdRequestAnalyticsProps) {
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [stats, setStats] = useState<AdRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (siteId) {
      loadAdRequestData();
    }
  }, [siteId, currentPage, pageSize, statusFilter, dateRange]);

  const loadAdRequestData = async () => {
    if (!siteId) return;
    
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        publisherService.getAdRequests(siteId, currentPage, pageSize, statusFilter),
        publisherService.getAdRequestStats(siteId)
      ]);
      
      setAdRequests(requestsData.adRequests || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load ad request data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SERVED': return 'bg-green-500';
      case 'PROCESSED': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      case 'BLOCKED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SERVED': return <CheckCircle className="h-4 w-4" />;
      case 'PROCESSED': return <Clock className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'FAILED': return <XCircle className="h-4 w-4" />;
      case 'BLOCKED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
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

  const filteredRequests = adRequests.filter(request => {
    if (searchQuery) {
      return (
        request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.adUnit?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Request Analytics</h2>
          <p className="text-muted-foreground">
            {siteName ? `Analytics for ${siteName}` : 'Monitor ad request performance and metrics'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {getDateRangeLabel(dateRange)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalRequests > 0 
                  ? `${((stats.summary.totalImpressions / stats.summary.totalRequests) * 100).toFixed(1)}% fill rate`
                  : '0% fill rate'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalImpressions > 0 
                  ? `${((stats.summary.totalClicks / stats.summary.totalImpressions) * 100).toFixed(2)}% CTR`
                  : '0% CTR'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.ctr.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
          <CardDescription>
            Customize your analytics view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Selector
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'SERVED', label: 'Served' },
                  { value: 'PROCESSED', label: 'Processed' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'FAILED', label: 'Failed' },
                  { value: 'BLOCKED', label: 'Blocked' }
                ]}
                placeholder="Filter by status"
              />
            </div>
            
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
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
            </div>
            
            <div>
              <Label htmlFor="pageSize">Page Size</Label>
              <Selector
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
                options={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                  { value: '100', label: '100 per page' }
                ]}
                placeholder="Select page size"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of ad requests by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.stats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(stat.status)}>
                      {getStatusIcon(stat.status)}
                    </Badge>
                    <span className="font-medium">{stat.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat._count.status}</div>
                    <p className="text-sm text-muted-foreground">
                      {stats.summary.totalRequests > 0 
                        ? `${((stat._count.status / stats.summary.totalRequests) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Requests</CardTitle>
          <CardDescription>
            Detailed view of individual ad requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ad requests found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Request ID</th>
                    <th className="text-left py-2 font-medium">Ad Unit</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Bid/CPM</th>
                    <th className="text-left py-2 font-medium">Performance</th>
                    <th className="text-left py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 font-mono text-xs">
                        {request.requestId.slice(0, 8)}...
                      </td>
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{request.adUnit?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.adUnit?.size} • {request.adUnit?.format}
                          </div>
                        </div>
                      </td>
                      <td className="py-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div>
                          {request.bidAmount && (
                            <div className="text-sm">{formatCurrency(request.bidAmount)}</div>
                          )}
                          {request.cpm && (
                            <div className="text-xs text-muted-foreground">
                              CPM: {formatCurrency(request.cpm)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {request.impression && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Impression
                            </Badge>
                          )}
                          {request.clickThrough && (
                            <Badge variant="default" className="text-xs">
                              <MousePointer className="h-3 w-3 mr-1" />
                              Click
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * pageSize >= filteredRequests.length}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 