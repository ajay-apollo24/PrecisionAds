import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Trash2 } from 'lucide-react';
import { Campaign, CreateCampaignData, UpdateCampaignData } from '../../services/advertiser.service';
import { CreativeAsset } from '../../services/creative-assets.service';

interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: CreateCampaignData | UpdateCampaignData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CAMPAIGN_TYPES = [
  { value: 'DISPLAY', label: 'Display' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'NATIVE', label: 'Native' },
  { value: 'SEARCH', label: 'Search' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'RETARGETING', label: 'Retargeting' },
  { value: 'RTB', label: 'RTB' },
  { value: 'PROGRAMMATIC', label: 'Programmatic' }
];

const BUDGET_TYPES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'LIFETIME', label: 'Lifetime' },
  { value: 'MONTHLY', label: 'Monthly' }
];

const BID_STRATEGIES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO_CPC', label: 'Auto CPC' },
  { value: 'AUTO_CPM', label: 'Auto CPM' },
  { value: 'TARGET_CPA', label: 'Target CPA' },
  { value: 'PREDICTIVE', label: 'Predictive' },
  { value: 'AI_OPTIMIZED', label: 'AI Optimized' }
];

export function CampaignForm({ campaign, onSubmit, onCancel, isLoading = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<CreateCampaignData>({
    name: '',
    type: 'DISPLAY',
    startDate: '',
    endDate: '',
    budget: 0,
    budgetType: 'LIFETIME',
    bidStrategy: 'MANUAL',
    targetCPM: undefined,
    targetCPC: undefined,
    targetCPA: undefined,
    dailyBudget: undefined
  });

  const [selectedAssets, setSelectedAssets] = useState<CreativeAsset[]>([]);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!campaign;

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        type: campaign.type,
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        budget: campaign.budget,
        budgetType: campaign.budgetType,
        bidStrategy: campaign.bidStrategy,
        targetCPM: campaign.targetCPM || undefined,
        targetCPC: campaign.targetCPC || undefined,
        targetCPA: campaign.targetCPA || undefined,
        dailyBudget: campaign.dailyBudget || undefined
      });
    }
  }, [campaign]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (formData.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.budgetType === 'DAILY' && (!formData.dailyBudget || formData.dailyBudget <= 0)) {
      newErrors.dailyBudget = 'Daily budget is required for daily budget type';
    }

    // Validate bid strategy specific fields
    if (formData.bidStrategy === 'AUTO_CPM' && (!formData.targetCPM || formData.targetCPM <= 0)) {
      newErrors.targetCPM = 'Target CPM is required for Auto CPM strategy';
    }

    if (formData.bidStrategy === 'AUTO_CPC' && (!formData.targetCPC || formData.targetCPC <= 0)) {
      newErrors.targetCPC = 'Target CPC is required for Auto CPC strategy';
    }

    if (formData.bidStrategy === 'TARGET_CPA' && (!formData.targetCPA || formData.targetCPA <= 0)) {
      newErrors.targetCPA = 'Target CPA is required for Target CPA strategy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateCampaignData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting campaign:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update your campaign settings and targeting' : 'Set up a new advertising campaign with targeting and budget'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Campaign Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter campaign name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type *</Label>
                  <Selector
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                    options={CAMPAIGN_TYPES}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bidStrategy">Bid Strategy *</Label>
                  <Selector
                    value={formData.bidStrategy}
                    onValueChange={(value) => handleInputChange('bidStrategy', value)}
                    options={BID_STRATEGIES}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Creative Assets Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Creative Assets</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Selected Assets</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssetSelector(true)}
                  >
                    {selectedAssets.length > 0 ? 'Manage Assets' : 'Select Assets'}
                  </Button>
                </div>
                
                {selectedAssets.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-2">No creative assets selected</p>
                    <p className="text-sm text-gray-400">Click "Select Assets" to choose creative assets for this campaign</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAssets.map((asset) => (
                      <div key={asset.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                            <p className="text-xs text-gray-500">{asset.fileName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {asset.mimeType.split('/')[1].toUpperCase()}
                              </Badge>
                              {asset.dimensions && (
                                <Badge variant="outline" className="text-xs">
                                  {asset.dimensions.width}x{asset.dimensions.height}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAssets(prev => prev.filter(a => a.id !== asset.id))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Budget Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Budget Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget *</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.budget ? "border-red-500" : ""}
                  />
                  {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetType">Budget Type *</Label>
                  <Selector
                    value={formData.budgetType}
                    onValueChange={(value) => handleInputChange('budgetType', value)}
                    options={BUDGET_TYPES}
                  />
                </div>
              </div>

              {formData.budgetType === 'DAILY' && (
                <div className="space-y-2">
                  <Label htmlFor="dailyBudget">Daily Budget *</Label>
                  <Input
                    id="dailyBudget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dailyBudget || ''}
                    onChange={(e) => handleInputChange('dailyBudget', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                    className={errors.dailyBudget ? "border-red-500" : ""}
                  />
                  {errors.dailyBudget && <p className="text-sm text-red-500">{errors.dailyBudget}</p>}
                </div>
              )}
            </div>

            {/* Bid Strategy Specific Fields */}
            {(formData.bidStrategy === 'AUTO_CPM' || formData.bidStrategy === 'MANUAL') && (
              <div className="space-y-2">
                <Label htmlFor="targetCPM">Target CPM</Label>
                <Input
                  id="targetCPM"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetCPM || ''}
                  onChange={(e) => handleInputChange('targetCPM', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                  className={errors.targetCPM ? "border-red-500" : ""}
                />
                {errors.targetCPM && <p className="text-sm text-red-500">{errors.targetCPM}</p>}
              </div>
            )}

            {(formData.bidStrategy === 'AUTO_CPC' || formData.bidStrategy === 'MANUAL') && (
              <div className="space-y-2">
                <Label htmlFor="targetCPC">Target CPC</Label>
                <Input
                  id="targetCPC"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetCPC || ''}
                  onChange={(e) => handleInputChange('targetCPC', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                  className={errors.targetCPC ? "border-red-500" : ""}
                />
                {errors.targetCPC && <p className="text-sm text-red-500">{errors.targetCPC}</p>}
              </div>
            )}

            {(formData.bidStrategy === 'TARGET_CPA' || formData.bidStrategy === 'MANUAL') && (
              <div className="space-y-2">
                <Label htmlFor="targetCPA">Target CPA</Label>
                <Input
                  id="targetCPA"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetCPA || ''}
                  onChange={(e) => handleInputChange('targetCPA', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                  className={errors.targetCPA ? "border-red-500" : ""}
                />
                {errors.targetCPA && <p className="text-sm text-red-500">{errors.targetCPA}</p>}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (isEditMode ? 'Update Campaign' : 'Create Campaign')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Asset Selector Modal */}
      {showAssetSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Select Creative Assets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssetSelector(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search assets..."
                  className="flex-1"
                />
                <Selector
                  value="all"
                  onValueChange={() => {}}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'image', label: 'Images' },
                    { value: 'video', label: 'Videos' },
                    { value: 'html5', label: 'HTML5' }
                  ]}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mock assets for demonstration */}
                {[
                  {
                    id: '1',
                    name: 'Summer Banner',
                    fileName: 'summer_banner.jpg',
                    mimeType: 'image/jpeg',
                    dimensions: { width: 728, height: 90 },
                    status: 'VALIDATED'
                  },
                  {
                    id: '2',
                    name: 'Product Video',
                    fileName: 'product_video.mp4',
                    mimeType: 'video/mp4',
                    status: 'VALIDATED'
                  },
                  {
                    id: '3',
                    name: 'Interactive Ad',
                    fileName: 'interactive.html',
                    mimeType: 'text/html',
                    status: 'VALIDATED'
                  }
                ].map((asset) => (
                  <div
                    key={asset.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedAssets.some(a => a.id === asset.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (selectedAssets.some(a => a.id === asset.id)) {
                        setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
                      } else {
                        setSelectedAssets(prev => [...prev, asset as CreativeAsset]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                        <p className="text-xs text-gray-500">{asset.fileName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {asset.mimeType.split('/')[1].toUpperCase()}
                          </Badge>
                          {asset.dimensions && (
                            <Badge variant="outline" className="text-xs">
                              {asset.dimensions.width}x{asset.dimensions.height}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="ml-2">
                        {selectedAssets.some(a => a.id === asset.id) && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAssetSelector(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowAssetSelector(false)}
              >
                Confirm Selection ({selectedAssets.length} assets)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 