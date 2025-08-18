import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/selector';
import { Textarea } from '../ui/textarea';
import { 
  Brain, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { advancedAlgorithmsService, AIOptimizationCampaign, OptimizationParameters } from '../../services/advanced-algorithms.service';

const AIOptimizationManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AIOptimizationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AIOptimizationCampaign | null>(null);
  const [organizationId, setOrganizationId] = useState('demo-org'); // This should come from auth context

  const [formData, setFormData] = useState({
    name: '',
    optimizationType: 'PERFORMANCE' as const,
    parameters: {},
    description: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await advancedAlgorithmsService.getAIOptimizationCampaigns(organizationId);
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        // Update existing campaign
        await advancedAlgorithmsService.updateAIOptimizationCampaign(
          editingCampaign.id,
          organizationId,
          formData
        );
      } else {
        // Create new campaign
        await advancedAlgorithmsService.createAIOptimizationCampaign(organizationId, formData);
      }
      
      setShowForm(false);
      setEditingCampaign(null);
      setFormData({ name: '', optimizationType: 'PERFORMANCE', parameters: {}, description: '' });
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign: AIOptimizationCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      optimizationType: campaign.optimizationType,
      parameters: campaign.parameters,
      description: campaign.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await advancedAlgorithmsService.deleteAIOptimizationCampaign(campaignId, organizationId);
        loadCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const handleExecute = async (campaignId: string) => {
    try {
      const params: OptimizationParameters = {
        optimizationType: 'PERFORMANCE',
        parameters: {}
      };
      await advancedAlgorithmsService.executeAIOptimization(campaignId, organizationId, params);
      loadCampaigns();
    } catch (error) {
      console.error('Error executing campaign:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
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
        return <Target className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">AI Optimization Management</h1>
          <p className="text-gray-600 mt-2">
            Manage AI-powered campaign optimization campaigns
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </CardTitle>
            <CardDescription>
              Configure AI optimization parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="optimizationType">Optimization Type</Label>
                  <Select
                    value={formData.optimizationType}
                    onValueChange={(value: any) => setFormData({ ...formData, optimizationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERFORMANCE">Performance</SelectItem>
                      <SelectItem value="REVENUE">Revenue</SelectItem>
                      <SelectItem value="EFFICIENCY">Efficiency</SelectItem>
                      <SelectItem value="TARGETING">Targeting</SelectItem>
                      <SelectItem value="BIDDING">Bidding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter campaign description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCampaign(null);
                    setFormData({ name: '', optimizationType: 'PERFORMANCE', parameters: {}, description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Optimization Campaigns
          </CardTitle>
          <CardDescription>
            {campaigns.length} campaigns found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getOptimizationTypeIcon(campaign.optimizationType)}
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {campaign.optimizationType}
                      {campaign.description && ` • ${campaign.description}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(campaign.status)}
                    <Badge className="ml-1">
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecute(campaign.id)}
                      disabled={campaign.status === 'ACTIVE'}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {campaigns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No AI optimization campaigns found. Create your first campaign to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIOptimizationManagement; 