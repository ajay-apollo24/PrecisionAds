import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download,
  Trash2,
  Archive,
  RefreshCw,
  Eye,
  Edit,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import { creativeAssetsService } from '../../services/creative-assets.service';

interface CreativeAsset {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  status: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  cdnUrl?: string;
  createdAt: string;
  validationErrors?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

interface AssetLibraryProps {
  onSelectAsset?: (asset: CreativeAsset) => void;
  onEditAsset?: (asset: CreativeAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  onArchiveAsset?: (assetId: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onArchiveAsset
}) => {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'fileSize'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      // Get organization ID from context or props - for now using a default
      const organizationId = 'cmel727sf0002tuo23kkxb1zb'; // This should come from user context
      const result = await creativeAssetsService.getAssets(organizationId);
      setAssets(result.assets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSort = (field: 'name' | 'createdAt' | 'fileSize') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    const newSelected = new Set(selectedAssets);
    if (checked) {
      newSelected.add(assetId);
    } else {
      newSelected.delete(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  const handleBulkAction = (action: 'delete' | 'archive') => {
    selectedAssets.forEach(assetId => {
      if (action === 'delete') {
        onDeleteAsset?.(assetId);
      } else if (action === 'archive') {
        onArchiveAsset?.(assetId);
      }
    });
    setSelectedAssets(new Set());
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    const matchesType = selectedType === 'all' || 
                       (selectedType === 'images' && asset.mimeType.startsWith('image/')) ||
                       (selectedType === 'videos' && asset.mimeType.startsWith('video/')) ||
                       (selectedType === 'html' && asset.mimeType === 'text/html');
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'fileSize':
        aValue = a.fileSize;
        bValue = b.fileSize;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Asset Library</h1>
          <p className="text-gray-600">Browse and manage your creative assets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadAssets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {selectedAssets.size > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('archive')}
                className="text-orange-600"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive ({selectedAssets.size})
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedAssets.size})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets by name, filename, or tags..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="VALIDATED">Validated</option>
                <option value="PROCESSING">Processing</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
                <option value="html">HTML5</option>
              </select>
              
                              <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Display */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Assets ({sortedAssets.length})</TabsTrigger>
          <TabsTrigger value="images">
            Images ({sortedAssets.filter(a => a.mimeType.startsWith('image/')).length})
          </TabsTrigger>
          <TabsTrigger value="videos">
            Videos ({sortedAssets.filter(a => a.mimeType.startsWith('video/')).length})
          </TabsTrigger>
          <TabsTrigger value="html">
            HTML5 ({sortedAssets.filter(a => a.mimeType === 'text/html').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading assets...</div>
          ) : sortedAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assets found</div>
          ) : (
            <>
              {/* Bulk Selection Header */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedAssets.size === sortedAssets.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedAssets.size} of {sortedAssets.length} selected
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Sort by:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className={sortBy === 'name' ? 'bg-blue-100' : ''}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('createdAt')}
                    className={sortBy === 'createdAt' ? 'bg-blue-100' : ''}
                  >
                    Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('fileSize')}
                    className={sortBy === 'fileSize' ? 'bg-blue-100' : ''}
                  >
                    Size {sortBy === 'fileSize' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </Button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {sortedAssets.map((asset) => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    viewMode={viewMode}
                    selected={selectedAssets.has(asset.id)}
                    onSelect={(checked) => handleSelectAsset(asset.id, checked)}
                    onSelectAsset={onSelectAsset}
                    onEditAsset={onEditAsset}
                    onDeleteAsset={onDeleteAsset}
                    onArchiveAsset={onArchiveAsset}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AssetCardProps {
  asset: CreativeAsset;
  viewMode: 'grid' | 'list';
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onSelectAsset?: (asset: CreativeAsset) => void;
  onEditAsset?: (asset: CreativeAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  onArchiveAsset?: (assetId: string) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  viewMode, 
  selected,
  onSelect,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onArchiveAsset
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect(e.target.checked)}
                className="rounded"
              />
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                {asset.mimeType.startsWith('image/') && '🖼️'}
                {asset.mimeType.startsWith('video/') && '🎥'}
                {asset.mimeType === 'text/html' && '🌐'}
              </div>
              <div>
                <h3 className="font-semibold">{asset.name}</h3>
                <p className="text-sm text-gray-600">{asset.fileName}</p>
                <div className="flex gap-2 mt-1">
                  <Badge className={getStatusColor(asset.status)}>
                    {asset.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(asset.fileSize)}
                  </span>
                  {asset.dimensions && (
                    <span className="text-sm text-gray-500">
                      {asset.dimensions.width}×{asset.dimensions.height}
                    </span>
                  )}
                </div>
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {asset.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {asset.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{asset.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectAsset?.(asset)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditAsset?.(asset)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {asset.cdnUrl && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onArchiveAsset?.(asset.id)}
                className="text-orange-600"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDeleteAsset?.(asset.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="absolute top-2 left-2 z-10 rounded"
        />
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {asset.mimeType.startsWith('image/') && '🖼️'}
          {asset.mimeType.startsWith('video/') && '🎥'}
          {asset.mimeType === 'text/html' && '🌐'}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{asset.name}</h3>
        <p className="text-sm text-gray-600 truncate">{asset.fileName}</p>
        <div className="flex gap-2 mt-2">
          <Badge className={getStatusColor(asset.status)}>
            {asset.status}
          </Badge>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {formatFileSize(asset.fileSize)}
          {asset.dimensions && ` • ${asset.dimensions.width}×${asset.dimensions.height}`}
          {asset.duration && ` • ${asset.duration}s`}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {formatDate(asset.createdAt)}
        </div>
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {asset.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {asset.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{asset.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onSelectAsset?.(asset)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEditAsset?.(asset)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 