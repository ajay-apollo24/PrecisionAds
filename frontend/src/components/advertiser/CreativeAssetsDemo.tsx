import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { AssetSelector } from './AssetSelector';
import { Badge } from '../ui/badge';
import { Image, Video, FileText, File, CheckCircle } from 'lucide-react';

interface CreativeAsset {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  status: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  cdnUrl?: string;
  createdAt: string;
  organizationId: string;
}

interface CampaignFormData {
  name: string;
  type: string;
  creativeAsset: CreativeAsset | null;
  budget: number;
  startDate: string;
  endDate: string;
}

export function CreativeAssetsDemo() {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: 'DISPLAY',
    creativeAsset: null,
    budget: 1000,
    startDate: '',
    endDate: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleAssetSelect = (asset: CreativeAsset | null) => {
    setFormData(prev => ({ ...prev, creativeAsset: asset }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    console.log('Campaign form submitted:', formData);
  };

  const getAssetTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.includes('html')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Campaign Created Successfully!</h2>
              <p className="text-green-700 mb-6">
                Your campaign "{formData.name}" has been created with the selected creative asset.
              </p>
              
              {formData.creativeAsset && (
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Selected Asset:</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getAssetTypeIcon(formData.creativeAsset.mimeType)}
                    </div>
                    <div>
                      <p className="font-medium">{formData.creativeAsset.name}</p>
                      <div className="text-sm text-gray-600">
                        {formatFileSize(formData.creativeAsset.fileSize)}
                        {formData.creativeAsset.dimensions && (
                          <span className="ml-2">
                            {formData.creativeAsset.dimensions.width}×{formData.creativeAsset.dimensions.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => setSubmitted(false)}
                className="mt-6"
              >
                Create Another Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Creation with Creative Assets</CardTitle>
          <CardDescription>
            This demo shows how creative assets integrate with campaign creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Campaign Type</Label>
              <Selector
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                options={[
                  { value: 'DISPLAY', label: 'Display' },
                  { value: 'VIDEO', label: 'Video' },
                  { value: 'NATIVE', label: 'Native' },
                  { value: 'HTML5', label: 'HTML5' }
                ]}
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                min="100"
                step="100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <AssetSelector
                organizationId="demo-org"
                selectedAssetId={formData.creativeAsset?.id}
                onAssetSelect={handleAssetSelect}
                creativeType={formData.type}
              />
            </div>

            {formData.creativeAsset && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Asset Validation</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Format: {formData.creativeAsset.mimeType}</span>
                  </div>
                  {formData.creativeAsset.dimensions && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Dimensions: {formData.creativeAsset.dimensions.width}×{formData.creativeAsset.dimensions.height}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Size: {formatFileSize(formData.creativeAsset.fileSize)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Status: {formData.creativeAsset.status}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setFormData({
                name: '',
                type: 'DISPLAY',
                creativeAsset: null,
                budget: 1000,
                startDate: '',
                endDate: ''
              })}>
                Reset
              </Button>
              <Button type="submit" disabled={!formData.creativeAsset}>
                Create Campaign
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Asset Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-1">Before (URL-based)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manual URL entry</li>
                <li>• No validation</li>
                <li>• No performance tracking</li>
                <li>• Risk of broken links</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <h4 className="font-medium mb-1">After (Asset-based)</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Visual asset selection</li>
                <li>• Automatic validation</li>
                <li>• Performance analytics</li>
                <li>• CDN optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 