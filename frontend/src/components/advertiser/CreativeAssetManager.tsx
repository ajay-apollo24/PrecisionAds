import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AssetUpload } from './AssetUpload';
import { AssetLibrary } from './AssetLibrary';
import { AssetPreview } from './AssetPreview';
import { Plus, Upload, Image, Video, FileText, Grid, List } from 'lucide-react';

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
  selectedAssetId 
}: CreativeAssetManagerProps) {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);

  useEffect(() => {
    loadAssets();
  }, [filters]);

  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find(a => a.id === selectedAssetId);
      setSelectedAsset(asset || null);
    }
  }, [selectedAssetId, assets]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockAssets: CreativeAsset[] = [
        {
          id: '1',
          name: 'Summer Banner',
          fileName: 'summer_banner.jpg',
          fileSize: 245760,
          mimeType: 'image/jpeg',
          dimensions: { width: 728, height: 90 },
          status: 'VALIDATED',
          cdnUrl: 'https://example.com/cdn/summer_banner.jpg',
          createdAt: new Date().toISOString(),
          organizationId
        },
        {
          id: '2',
          name: 'Product Video',
          fileName: 'product_video.mp4',
          fileSize: 5242880,
          mimeType: 'video/mp4',
          duration: 30,
          status: 'PROCESSING',
          createdAt: new Date().toISOString(),
          organizationId
        }
      ];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (asset: CreativeAsset) => {
    setSelectedAsset(asset);
    onAssetSelect?.(asset);
  };

  const handleAssetUpload = (newAsset: CreativeAsset) => {
    setAssets(prev => [newAsset, ...prev]);
  };

  const getAssetTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.includes('html')) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusBadge = (status: CreativeAsset['status']) => {
    const statusConfig = {
      PENDING: { variant: 'secondary', text: 'Pending' },
      PROCESSING: { variant: 'default', text: 'Processing' },
      VALIDATED: { variant: 'default', text: 'Validated' },
      REJECTED: { variant: 'destructive', text: 'Rejected' },
      ARCHIVED: { variant: 'secondary', text: 'Archived' }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant as any}>{config.text}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAssets = assets.filter(asset => {
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.type && !asset.mimeType.includes(filters.type)) return false;
    if (filters.search && !asset.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Creative Assets</h2>
          <p className="text-muted-foreground">
            Manage and organize your creative assets for campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Asset Library</TabsTrigger>
          <TabsTrigger value="upload">Upload Assets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search assets..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="max-w-sm"
              />
            </div>
            <Selector
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              placeholder="Filter by status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'VALIDATED', label: 'Validated' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'ARCHIVED', label: 'Archived' }
              ]}
            />
            <Selector
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              placeholder="Filter by type"
              options={[
                { value: '', label: 'All Types' },
                { value: 'image', label: 'Images' },
                { value: 'video', label: 'Videos' },
                { value: 'html', label: 'HTML5' },
                { value: 'text', label: 'Text' }
              ]}
            />
          </div>

          <AssetLibrary
            assets={filteredAssets}
            loading={loading}
            viewMode={viewMode}
            onAssetSelect={handleAssetSelect}
            selectedAssetId={selectedAsset?.id}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <AssetUpload
            organizationId={organizationId}
            onUploadComplete={handleAssetUpload}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {selectedAsset ? (
            <AssetPreview asset={selectedAsset} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Select an asset from the library to preview
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 