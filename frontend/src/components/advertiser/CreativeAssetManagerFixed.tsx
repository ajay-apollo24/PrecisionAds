import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AssetUpload } from './AssetUpload';
import { AssetLibrary } from './AssetLibraryFixed';
import { AssetPreview } from './AssetPreview';
import { Plus, Upload, Image, Video, FileText, ArrowLeft } from 'lucide-react';
import { CreativeAsset } from '../../services/creative-assets.service';

interface CreativeAssetManagerProps {
  organizationId: string;
  onAssetSelect?: (asset: CreativeAsset) => void;
  onAssetUpload?: (asset: CreativeAsset) => void;
  selectedAssetId?: string;
  onBack?: () => void;
}

export function CreativeAssetManager({
  organizationId,
  onAssetSelect,
  onAssetUpload,
  selectedAssetId,
  onBack
}: CreativeAssetManagerProps) {
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);
  const [activeTab, setActiveTab] = useState('library');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAssetSelect = (asset: CreativeAsset) => {
    setSelectedAsset(asset);
    setActiveTab('preview');
    onAssetSelect?.(asset);
  };

  const handleUploadComplete = (assetId: string) => {
    console.log('Upload completed for asset:', assetId);
    // Trigger a refresh of the asset library
    setRefreshKey(prev => prev + 1);
    // Switch to library tab to see the uploaded asset
    setActiveTab('library');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Creative Assets</h1>
            <p className="text-gray-600">Manage and organize your creative assets for campaigns</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Asset Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Assets
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!selectedAsset}>
            <FileText className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Asset Library Tab */}
        <TabsContent value="library">
          <AssetLibrary
            key={refreshKey} // Force refresh when key changes
            organizationId={organizationId}
            onSelectAsset={handleAssetSelect}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        {/* Upload Assets Tab */}
        <TabsContent value="upload">
          <AssetUpload
            onUploadComplete={handleUploadComplete}
            onClose={() => setActiveTab('library')}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          {selectedAsset ? (
            <AssetPreview
              asset={selectedAsset}
              onClose={() => {
                setSelectedAsset(null);
                setActiveTab('library');
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Select an asset to preview</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Image className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Assets</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Videos</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">HTML5</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Processing</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 