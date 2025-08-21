import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Image, Video, FileText, File, Download, Edit, Trash2, Copy, ExternalLink } from 'lucide-react';

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

interface AssetPreviewProps {
  asset: CreativeAsset;
}

export function AssetPreview({ asset }: AssetPreviewProps) {
  const getAssetTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType.includes('html')) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
    console.log('Copied to clipboard:', text);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'download':
        if (asset.cdnUrl) {
          window.open(asset.cdnUrl, '_blank');
        }
        break;
      case 'edit':
        // TODO: Implement edit functionality
        console.log('Edit asset:', asset.id);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
          console.log('Delete asset:', asset.id);
        }
        break;
      case 'copy-url':
        if (asset.cdnUrl) {
          copyToClipboard(asset.cdnUrl);
        }
        break;
    }
  };

  const renderPreview = () => {
    if (asset.mimeType.startsWith('image/') && asset.cdnUrl) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={asset.cdnUrl} 
            alt={asset.name}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    if (asset.mimeType.startsWith('video/') && asset.cdnUrl) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video 
            controls
            className="w-full h-full"
            poster={asset.cdnUrl.replace(/\.[^/.]+$/, '.jpg')}
          >
            <source src={asset.cdnUrl} type={asset.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (asset.mimeType.includes('html')) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">HTML5 Asset</p>
            {asset.cdnUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open(asset.cdnUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview in New Tab
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Preview not available</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Asset Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getAssetTypeIcon(asset.mimeType)}
            <span>Asset Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPreview()}
        </CardContent>
      </Card>

      {/* Asset Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Asset Details</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('copy-url')}
                disabled={!asset.cdnUrl}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('download')}
                disabled={!asset.cdnUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('edit')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{asset.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Name</label>
                <p className="text-sm text-gray-900">{asset.fileName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Type</label>
                <p className="text-sm text-gray-900">{asset.mimeType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">File Size</label>
                <p className="text-sm text-gray-900">{formatFileSize(asset.fileSize)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  {getStatusBadge(asset.status)}
                </div>
              </div>
              
              {asset.dimensions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Dimensions</label>
                  <p className="text-sm text-gray-900">
                    {asset.dimensions.width} × {asset.dimensions.height} pixels
                  </p>
                </div>
              )}
              
              {asset.duration && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900">{asset.duration} seconds</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">{formatDate(asset.createdAt)}</p>
              </div>
            </div>
          </div>
          
          {asset.cdnUrl && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-gray-500">CDN URL</label>
              <div className="mt-1 flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-800 break-all">
                  {asset.cdnUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction('copy-url')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Information</CardTitle>
          <CardDescription>
            This asset can be used in campaigns and ad units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-blue-600">Active Campaigns</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-green-600">Total Impressions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-purple-600">Total Clicks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 