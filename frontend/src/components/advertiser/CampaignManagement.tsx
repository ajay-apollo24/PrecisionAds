import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CampaignForm } from './CampaignForm';
import { Campaign, advertiserService, CampaignFilters } from '../../services/advertiser.service';
import { Plus, Edit, Trash2, Play, Pause, Eye } from 'lucide-react';

interface CampaignManagementProps {
  organizationId: string;
}

export function CampaignManagement({ organizationId }: CampaignManagementProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadCampaigns();
  }, [filters]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading campaigns with filters:', filters);
      console.log('🔄 Organization ID:', organizationId);
      
      const response = await advertiserService.getCampaigns(filters, organizationId);
      console.log('📊 Campaigns API Response:', response);
      console.log('📊 Campaigns data:', response.campaigns);
      console.log('📊 Pagination:', response.pagination);
      
      // Handle both 'data' and 'campaigns' fields for backward compatibility
      const campaignsData = response.campaigns || response.data || [];
      setCampaigns(campaignsData);
      setPagination(response.pagination);
      
      console.log('✅ Campaigns state updated:', campaignsData.length, 'campaigns');
    } catch (error) {
      console.error('💥 Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (data: any) => {
    try {
      setSubmitting(true);
      await advertiserService.createCampaign(data, organizationId);
      setShowForm(false);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCampaign = async (data: any) => {
    if (!editingCampaign) return;
    
    try {
      setSubmitting(true);
      await advertiserService.updateCampaign(editingCampaign.id, data, organizationId);
      setEditingCampaign(null);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to update campaign:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await advertiserService.deleteCampaign(campaignId, organizationId);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      await advertiserService.updateCampaignStatus(campaignId, newStatus, organizationId);
      loadCampaigns();
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  const getStatusBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusActions = (campaign: Campaign) => {
    const actions = [];
    
    switch (campaign.status) {
      case 'DRAFT':
        actions.push(
          <Button
            key="activate"
            size="sm"
            onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
            className="h-8 px-2"
          >
            <Play className="h-3 w-3 mr-1" />
            Activate
          </Button>
        );
        break;
      case 'ACTIVE':
        actions.push(
          <Button
            key="pause"
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
            className="h-8 px-2"
          >
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
        );
        break;
      case 'PAUSED':
        actions.push(
          <Button
            key="resume"
            size="sm"
            onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
            className="h-8 px-2"
          >
            <Play className="h-3 w-3 mr-1" />
            Resume
          </Button>
        );
        break;
    }
    
    return actions;
  };

  if (showForm) {
    return (
      <CampaignForm
        onSubmit={handleCreateCampaign}
        onCancel={() => setShowForm(false)}
        isLoading={submitting}
      />
    );
  }

  if (editingCampaign) {
    return (
      <CampaignForm
        campaign={editingCampaign}
        onSubmit={handleUpdateCampaign}
        onCancel={() => setEditingCampaign(null)}
        isLoading={submitting}
      />
    );
  }

  return (
    <div className="space-y-6">
              <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaign Management</h1>
            <p className="text-muted-foreground">
              Manage your advertising campaigns and performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadCampaigns}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
              <select
                id="status-filter"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="type-filter" className="text-sm font-medium">Type</label>
              <select
                id="type-filter"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                value={filters.type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any || undefined }))}
              >
                <option value="">All Types</option>
                <option value="DISPLAY">Display</option>
                <option value="VIDEO">Video</option>
                <option value="NATIVE">Native</option>
                <option value="SEARCH">Search</option>
                <option value="SOCIAL">Social</option>
                <option value="RETARGETING">Retargeting</option>
                <option value="RTB">RTB</option>
                <option value="PROGRAMMATIC">Programmatic</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : (
              <>
                {pagination.total} campaigns found
                {campaigns && campaigns.length > 0 && (
                  <span className="ml-2 text-green-600">
                    • {campaigns.length} loaded
                  </span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading campaigns...</div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">
                <p className="text-lg font-medium">No campaigns found</p>
                <p className="text-sm text-muted-foreground">
                  {pagination.total > 0 ? 
                    `Backend shows ${pagination.total} campaigns but data couldn't be loaded` : 
                    'Create your first campaign to get started'
                  }
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Debug: campaigns.length = {campaigns?.length || 'undefined'}, 
                pagination.total = {pagination.total}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.type}</TableCell>
                      <TableCell>{formatCurrency(campaign.budget)}</TableCell>
                      <TableCell>{formatCurrency(campaign.totalSpent)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Impressions: {campaign.impressions.toLocaleString()}</div>
                          <div>Clicks: {campaign.clicks.toLocaleString()}</div>
                          <div>CTR: {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}%</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCampaign(campaign)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {getStatusActions(campaign)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} campaigns
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 