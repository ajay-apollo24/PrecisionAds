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
import { creativeAssetsService, CreativeAsset } from '../../services/creative-assets.service';

interface AssetLibraryProps {
  organizationId: string;
  onSelectAsset?: (asset: CreativeAsset) => void;
  onEditAsset?: (asset: CreativeAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
  onArchiveAsset?: (assetId: string) => void;
  onRefresh?: () => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  organizationId,
  onSelectAsset,
  onEditAsset,
  onDeleteAsset,
  onArchiveAsset,
  onRefresh
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, [organizationId]);

  const loadAssets = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Loading assets for organization:', organizationId);
      const response = await creativeAssetsService.getAssets(organizationId);
      console.log('Assets loaded:', response);
      setAssets(response.assets || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setError('Failed to load assets. Please try again.');
      // Fallback to showing some sample data
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAssets();
    onRefresh?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    const matchesType = selectedType === 'all' || 
                       (selectedType === 'image' && asset.mimeType.startsWith('image/')) ||
                       (selectedType === 'video' && asset.mimeType.startsWith('video/')) ||
                       (selectedType === 'html5' && asset.mimeType === 'text/html');
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const AssetCard = ({ asset }: { asset: CreativeAsset }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{asset.name}</h3>
          <p className="text-xs text-gray-500 truncate">{asset.fileName}</p>
        </div>
        <Badge className={`text-xs ${getStatusColor(asset.status)}`}>
          {asset.status}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{formatFileSize(asset.fileSize)}</span>
        <span>{formatDate(asset.createdAt)}</span>
      </div>
      
      {asset.dimensions && (
        <div className="text-xs text-gray-500 mb-3">
          {asset.dimensions.width} × {asset.dimensions.height}
        </div>
      )}
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectAsset?.(asset)}
          className="flex-1"
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditAsset?.(asset)}
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteAsset?.(asset.id)}
          className="text-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading assets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Library</h2>
          <p className="text-gray-600">Manage your creative assets</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
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
        </select>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="html5">HTML5</option>
        </select>
        
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Assets Grid/List */}
      {sortedAssets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Archive className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedStatus !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search filters'
                : 'Upload your first creative asset to get started'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
        }>
          {sortedAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {sortedAssets.length} of {assets.length} assets
      </div>
    </div>
  );
}; 