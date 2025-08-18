import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  Users, 
  Play, 
  Pause, 
  Settings,
  BarChart3,
  Activity,
  Target as TargetIcon,
  DollarSign
} from 'lucide-react';
import { advancedAlgorithmsService, AIOptimizationCampaign, PredictiveBiddingModel, RTBCampaign, ProgrammaticDeal, RetargetingCampaign } from '../../services/advanced-algorithms.service';

interface DashboardSummary {
  aiOptimization: {
    total: number;
    active: number;
    campaigns: any[];
  };
  predictiveBidding: {
    total: number;
    active: number;
    models: any[];
  };
  rtb: {
    total: number;
    active: number;
    campaigns: any[];
  };
  programmatic: {
    total: number;
    active: number;
    deals: any[];
  };
  retargeting: {
    total: number;
    active: number;
    campaigns: any[];
  };
}

interface AdvancedAlgorithmsDashboardProps {
  onBack?: () => void;
}

const AdvancedAlgorithmsDashboard: React.FC<AdvancedAlgorithmsDashboardProps> = ({ onBack }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [organizationId, setOrganizationId] = useState('demo-org'); // This should come from auth context

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await advancedAlgorithmsService.getAdvancedAlgorithmsSummary(organizationId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'TRAINING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOptimizationTypeIcon = (type: string) => {
    switch (type) {
      case 'PERFORMANCE':
        return <TrendingUp className="h-4 w-4" />;
      case 'REVENUE':
        return <DollarSign className="h-4 w-4" />;
      case 'EFFICIENCY':
        return <Activity className="h-4 w-4" />;
      case 'TARGETING':
        return <TargetIcon className="h-4 w-4" />;
      case 'BIDDING':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Algorithms Dashboard</h1>
          <p className="text-gray-600 mt-2">
            AI-powered optimization, predictive bidding, RTB, programmatic deals, and retargeting
          </p>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              ← Back to Dashboard
            </Button>
          )}
          <Button onClick={loadDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-optimization">AI Optimization</TabsTrigger>
          <TabsTrigger value="predictive-bidding">Predictive Bidding</TabsTrigger>
          <TabsTrigger value="rtb">RTB</TabsTrigger>
          <TabsTrigger value="programmatic">Programmatic</TabsTrigger>
          <TabsTrigger value="retargeting">Retargeting</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* AI Optimization Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  AI Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.aiOptimization.total || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {summary?.aiOptimization.active || 0} active campaigns
                </p>
                <Progress 
                  value={summary?.aiOptimization.total ? (summary.aiOptimization.active / summary.aiOptimization.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            {/* Predictive Bidding Card */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Predictive Bidding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.predictiveBidding.total || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {summary?.predictiveBidding.active || 0} active models
                </p>
                <Progress 
                  value={summary?.predictiveBidding.total ? (summary.predictiveBidding.active / summary.predictiveBidding.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            {/* RTB Card */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  RTB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.rtb.total || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {summary?.rtb.active || 0} active campaigns
                </p>
                <Progress 
                  value={summary?.rtb.total ? (summary.rtb.active / summary.rtb.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            {/* Programmatic Card */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-orange-600" />
                  Programmatic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.programmatic.total || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {summary?.programmatic.active || 0} active deals
                </p>
                <Progress 
                  value={summary?.programmatic.total ? (summary.programmatic.active / summary.programmatic.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            {/* Retargeting Card */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-red-600" />
                  Retargeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.retargeting.total || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {summary?.retargeting.active || 0} active campaigns
                </p>
                <Progress 
                  value={summary?.retargeting.total ? (summary.retargeting.active / summary.retargeting.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common operations for advanced algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  Start AI Optimization
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Train ML Model
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Zap className="h-6 w-6 mb-2" />
                  Execute RTB Deal
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  Create Programmatic Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Optimization Tab */}
        <TabsContent value="ai-optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Optimization Campaigns
              </CardTitle>
              <CardDescription>
                Manage AI-powered campaign optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.aiOptimization.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getOptimizationTypeIcon(campaign.optimizationType)}
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          Type: {campaign.optimizationType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!summary?.aiOptimization.campaigns || summary.aiOptimization.campaigns.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No AI optimization campaigns found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Bidding Tab */}
        <TabsContent value="predictive-bidding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Predictive Bidding Models
              </CardTitle>
              <CardDescription>
                Machine learning models for bid prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.predictiveBidding.models.map((model: any) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{model.name}</h4>
                        <p className="text-sm text-gray-600">
                          {model.modelType} • Accuracy: {model.accuracy?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!summary?.predictiveBidding.models || summary.predictiveBidding.models.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No predictive bidding models found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RTB Tab */}
        <TabsContent value="rtb" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                RTB Campaigns
              </CardTitle>
              <CardDescription>
                Real-time bidding campaigns and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.rtb.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          Exchange: {campaign.exchangeId} • Budget: ${campaign.budget}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!summary?.rtb.campaigns || summary.rtb.campaigns.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No RTB campaigns found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programmatic Tab */}
        <TabsContent value="programmatic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Programmatic Deals
              </CardTitle>
              <CardDescription>
                Programmatic advertising deals and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.programmatic.deals.map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Target className="h-5 w-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium">{deal.name}</h4>
                        <p className="text-sm text-gray-600">
                          {deal.type} • Budget: ${deal.budget}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(deal.status)}>
                        {deal.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!summary?.programmatic.deals || summary.programmatic.deals.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No programmatic deals found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retargeting Tab */}
        <TabsContent value="retargeting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Retargeting Campaigns
              </CardTitle>
              <CardDescription>
                Behavioral retargeting and audience segmentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.retargeting.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Users className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          Strategy: {campaign.bidStrategy} • Budget: ${campaign.budget}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!summary?.retargeting.campaigns || summary.retargeting.campaigns.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No retargeting campaigns found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAlgorithmsDashboard; 