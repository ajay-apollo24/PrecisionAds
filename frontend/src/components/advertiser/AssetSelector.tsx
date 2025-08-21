import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Image, Video, FileText, File, X, Plus, Search } from 'lucide-react';

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

interface AssetSelectorProps {
  organizationId: string;
  selectedAssetId?: string;
  onAssetSelect: (asset: CreativeAsset | null) => void;
  creativeType?: string;
  className?: string;
  disabled?: boolean;
}

export function AssetSelector({ 
  organizationId, 
  selectedAssetId, 
  onAssetSelect, 
  creativeType,
  className = '',
  disabled = false
}: AssetSelectorProps) {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);

  useEffect(() => {
    if (showAssetLibrary) {
      loadAssets();
    }
  }, [showAssetLibrary]);

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
          status: 'VALIDATED',
          createdAt: new Date().toISOString(),
          organizationId
        },
        {
          id: '3',
          name: 'HTML5 Banner',
          fileName: 'banner.html',
          fileSize: 102400,
          mimeType: 'text/html',
          dimensions: { width: 300, height: 250 },
          status: 'VALIDATED',
          cdnUrl: 'https://example.com/cdn/banner.html',
          createdAt: new Date().toISOString(),
          organizationId
        }
      ];
      
      // Filter by creative type if specified
      let filteredAssets = mockAssets;
      if (creativeType) {
        filteredAssets = mockAssets.filter(asset => {
          if (creativeType === 'IMAGE') return asset.mimeType.startsWith('image/');
          if (creativeType === 'VIDEO') return asset.mimeType.startsWith('video/');
          if (creativeType === 'HTML5') return asset.mimeType.includes('html');
          if (creativeType === 'TEXT') return asset.mimeType.includes('text');
          return true;
        });
      }
      
      // Filter by status - only show validated assets
      filteredAssets = filteredAssets.filter(asset => asset.status === 'VALIDATED');
      
      setAssets(filteredAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find(asset => asset.id === selectedAssetId);
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleAssetSelect = (asset: CreativeAsset) => {
    onAssetSelect(asset);
    setShowAssetLibrary(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onAssetSelect(null);
  };

  return (
    <div className={className}>
      <Label className="block mb-2">Creative Asset</Label>
      
      {selectedAsset ? (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getAssetTypeIcon(selectedAsset.mimeType)}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedAsset.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(selectedAsset.fileSize)}</span>
                    {selectedAsset.dimensions && (
                      <span>{selectedAsset.dimensions.width}×{selectedAsset.dimensions.height}</span>
                    )}
                    {selectedAsset.duration && (
                      <span>{selectedAsset.duration}s</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAssetLibrary(true)}
          disabled={disabled}
          className="w-full justify-start text-gray-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Select Creative Asset
        </Button>
      )}

      {/* Asset Library Modal */}
      {showAssetLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Creative Asset</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssetLibrary(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-8">
                  <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No assets found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map((asset) => (
                    <Card
                      key={asset.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleAssetSelect(asset)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          {asset.cdnUrl && asset.mimeType.startsWith('image/') ? (
                            <img 
                              src={asset.cdnUrl} 
                              alt={asset.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400">
                              {getAssetTypeIcon(asset.mimeType)}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatFileSize(asset.fileSize)}</span>
                            {asset.dimensions && (
                              <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 