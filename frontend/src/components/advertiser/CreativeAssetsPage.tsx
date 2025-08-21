import React, { useState } from 'react';
import { CreativeAssetManager } from './CreativeAssetManager';
import { AssetSelector } from './AssetSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Image, Video, FileText, Settings, Plus } from 'lucide-react';

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

interface CreativeAssetsPageProps {
  organizationId: string;
}

export function CreativeAssetsPage({ organizationId }: CreativeAssetsPageProps) {
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);
  const [activeTab, setActiveTab] = useState('manage');

  const handleAssetSelect = (asset: CreativeAsset) => {
    setSelectedAsset(asset);
  };

  const handleAssetUpload = (newAsset: CreativeAsset) => {
    setSelectedAsset(newAsset);
    setActiveTab('manage');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creative Assets</h1>
          <p className="text-muted-foreground">
            Upload, manage, and organize your creative assets for campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setActiveTab('upload')}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Assets
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Image className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">Image Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Video Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">HTML5 Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-600 rounded"></div>
              <div>
                <p className="text-2xl font-bold">44</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Asset Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Assets</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <CreativeAssetManager
            organizationId={organizationId}
            onAssetSelect={handleAssetSelect}
            selectedAssetId={selectedAsset?.id}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Assets</CardTitle>
              <CardDescription>
                Upload images, videos, HTML5 files, and other creative assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreativeAssetManager
                organizationId={organizationId}
                onAssetSelect={handleAssetSelect}
                onAssetUpload={handleAssetUpload}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Integration</CardTitle>
              <CardDescription>
                See how creative assets integrate with your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Asset Selection in Campaigns</h3>
                <p className="text-muted-foreground mb-4">
                  When creating campaigns, you can now select creative assets from your library instead of entering URLs manually.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Before (URL-based)</h4>
                    <div className="p-3 bg-gray-100 rounded text-sm font-mono">
                      creativeUrl: "https://example.com/banner.jpg"
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">After (Asset-based)</h4>
                    <div className="p-3 bg-blue-50 rounded text-sm">
                      <strong>Selected Asset:</strong> Summer Banner (728×90)
                      <br />
                      <span className="text-gray-600">Automatically validated and optimized</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Benefits of Asset Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <h4 className="font-medium text-green-900">Validation</h4>
                    <p className="text-sm text-green-700">Automatic format and size validation</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">⚡</span>
                    </div>
                    <h4 className="font-medium text-blue-900">Performance</h4>
                    <p className="text-sm text-blue-700">CDN delivery and optimization</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">📊</span>
                    </div>
                    <h4 className="font-medium text-purple-900">Analytics</h4>
                    <p className="text-sm text-purple-700">Track asset performance across campaigns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 