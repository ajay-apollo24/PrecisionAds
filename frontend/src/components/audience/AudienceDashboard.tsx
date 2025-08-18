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

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  estimatedSize: number;
  createdAt: string;
  updatedAt: string;
}

interface SegmentPerformance {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  ctr: number;
  conversionRate: number;
}

interface AudienceInsights {
  demographicInsights: any[];
  behavioralInsights: any[];
  engagementInsights: any[];
  summary: {
    totalAudienceSize: number;
    averageEngagementRate: number;
    topBehaviors: any[];
  };
}

const AudienceDashboard: React.FC = () => {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentPerformance, setSegmentPerformance] = useState<SegmentPerformance | null>(null);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    type: 'BEHAVIORAL',
    estimatedSize: 0,
  });

  useEffect(() => {
    fetchSegments();
    fetchAudienceInsights();
  }, []);

  useEffect(() => {
    if (selectedSegment) {
      fetchSegmentPerformance(selectedSegment);
    }
  }, [selectedSegment]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/audience-management/segments');
      setSegments(response.data.segments || []);
    } catch (err) {
      setError('Failed to fetch audience segments');
      console.error('Segments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentPerformance = async (segmentId: string) => {
    try {
      const response = await apiService.get(`/audience-management/segments/${segmentId}/performance`);
      setSegmentPerformance(response.data);
    } catch (err) {
      console.error('Segment performance fetch error:', err);
    }
  };

  const fetchAudienceInsights = async () => {
    try {
      const response = await apiService.get('/audience-management/insights');
      setAudienceInsights(response.data);
    } catch (err) {
      console.error('Audience insights fetch error:', err);
    }
  };

  const createSegment = async () => {
    try {
      setLoading(true);
      await apiService.post('/audience-management/segments', newSegment);
      setNewSegment({ name: '', description: '', type: 'BEHAVIORAL', estimatedSize: 0 });
      setShowCreateForm(false);
      fetchSegments();
    } catch (err) {
      setError('Failed to create audience segment');
      console.error('Create segment error:', err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BEHAVIORAL':
        return 'bg-blue-100 text-blue-800';
      case 'DEMOGRAPHIC':
        return 'bg-purple-100 text-purple-800';
      case 'GEOGRAPHIC':
        return 'bg-green-100 text-green-800';
      case 'INTEREST_BASED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading audience data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audience Management</h1>
          <p className="text-gray-600">Manage audience segments and insights</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>Create Segment</Button>
      </div>

      {/* Create Segment Modal */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Audience Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Segment Name</Label>
                <Input
                  id="name"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter segment name"
                />
              </div>
              <div>
                <Label htmlFor="type">Segment Type</Label>
                <Select value={newSegment.type} onValueChange={(value) => setNewSegment(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                    <SelectItem value="DEMOGRAPHIC">Demographic</SelectItem>
                    <SelectItem value="GEOGRAPHIC">Geographic</SelectItem>
                    <SelectItem value="INTEREST_BASED">Interest-Based</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedSize">Estimated Size</Label>
                <Input
                  id="estimatedSize"
                  type="number"
                  value={newSegment.estimatedSize}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, estimatedSize: parseInt(e.target.value) || 0 }))}
                  placeholder="Estimated audience size"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter segment description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={createSegment} disabled={!newSegment.name}>
                Create Segment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Audience Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSegment === segment.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSegment(segment.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{segment.name}</h4>
                      <Badge className={getStatusColor(segment.status)}>
                        {segment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className={getTypeColor(segment.type)}>
                        {segment.type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatNumber(segment.estimatedSize)} users
                      </span>
                    </div>
                  </div>
                ))}
                {segments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No audience segments found</p>
                    <p className="text-sm">Create your first segment to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Details and Performance */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {selectedSegment ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Segment Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Segment Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Name:</span>
                            <span>{segments.find(s => s.id === selectedSegment)?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span>{segments.find(s => s.id === selectedSegment)?.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span>{segments.find(s => s.id === selectedSegment)?.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated Size:</span>
                            <span>{formatNumber(segments.find(s => s.id === selectedSegment)?.estimatedSize || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Edit Segment
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            View Targeting Rules
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            Export Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500 py-8">
                      <p>Select a segment to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {selectedSegment && segmentPerformance ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatNumber(segmentPerformance.totalImpressions)}
                        </div>
                        <p className="text-sm text-gray-600">Impressions</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(segmentPerformance.totalClicks)}
                        </div>
                        <p className="text-sm text-gray-600">Clicks</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatNumber(segmentPerformance.totalConversions)}
                        </div>
                        <p className="text-sm text-gray-600">Conversions</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(segmentPerformance.totalRevenue)}
                        </div>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Click-Through Rate (CTR)</span>
                          <span>{formatPercentage(segmentPerformance.ctr)}</span>
                        </div>
                        <Progress value={segmentPerformance.ctr} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Conversion Rate</span>
                          <span>{formatPercentage(segmentPerformance.conversionRate)}</span>
                        </div>
                        <Progress value={segmentPerformance.conversionRate} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500 py-8">
                      <p>Select a segment to view performance</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {audienceInsights ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Demographic Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Total Audience Size</h4>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatNumber(audienceInsights.summary.totalAudienceSize)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Average Engagement Rate</h4>
                          <div className="text-2xl font-bold text-green-600">
                            {formatPercentage(audienceInsights.summary.averageEngagementRate)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Behaviors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {audienceInsights.summary.topBehaviors.map((behavior, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <span>{behavior.behaviorType}</span>
                            <Badge variant="outline">{behavior.frequency} occurrences</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500 py-8">
                      <p>Loading audience insights...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AudienceDashboard; 