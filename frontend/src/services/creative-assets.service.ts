import { apiService } from './api.service';

// Types for creative assets
export interface CreativeAsset {
  id: string;
  organizationId: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  fileHash: string;
  cdnUrl?: string;
  localPath?: string;
  status: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  validationErrors?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  assetVersions?: AssetVersion[];
  ads?: {
    id: string;
    name: string;
    campaignId: string;
  }[];
  tags?: string[];
}

export interface AssetVersion {
  id: string;
  assetId: string;
  version: number;
  filePath: string;
  cdnUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAssetData {
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  fileHash: string;
  metadata?: Record<string, any>;
}

export interface UpdateAssetData {
  name?: string;
  status?: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  validationErrors?: string[];
  metadata?: Record<string, any>;
  cdnUrl?: string;
}

export interface AssetFilters {
  status?: 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';
  mimeType?: string;
  organizationId?: string;
  search?: string;
}

export interface AssetUploadResponse {
  assetId: string;
  status: string;
  message: string;
  validationErrors?: string[];
}

export interface UploadProgress {
  assetId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'validating' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface AssetStats {
  totalAssets: number;
  totalSize: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentUploads: number;
}

class CreativeAssetsService {
  private baseUrl = '/api/v1/creative-assets';

  // Get all assets for an organization
  async getAssets(
    organizationId: string,
    filters: AssetFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ assets: CreativeAsset[]; total: number; page: number; totalPages: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await apiService.get(`${this.baseUrl}/assets?${params}`, organizationId);
      return response;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw error;
    }
  }

  // Get asset by ID
  async getAssetById(assetId: string, organizationId: string): Promise<CreativeAsset> {
    try {
      const response = await apiService.get(`${this.baseUrl}/assets/${assetId}`, organizationId);
      return response;
    } catch (error) {
      console.error('Failed to get asset:', error);
      throw error;
    }
  }

  // Upload single file
  async uploadAsset(
    file: File,
    organizationId: string,
    assetName?: string
  ): Promise<AssetUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (assetName) {
        formData.append('assetName', assetName);
      }

      // For FormData, we need to use fetch directly since apiService.post uses JSON.stringify
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'x-organization-id': organizationId,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload asset:', error);
      throw error;
    }
  }

  // Initialize chunked upload
  async initChunkedUpload(
    fileName: string,
    mimeType: string,
    totalSize: number,
    chunkSize: number,
    organizationId: string
  ): Promise<{
    uploadId: string;
    totalChunks: number;
    chunkSize: number;
    totalSize: number;
    fileName: string;
    mimeType: string;
  }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/upload/chunked/init`,
        {
          fileName,
          mimeType,
          totalSize,
          chunkSize
        },
        {
          headers: { 'x-organization-id': organizationId }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to initialize chunked upload:', error);
      throw error;
    }
  }

  // Upload chunk
  async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    chunkData: ArrayBuffer,
    isLastChunk: boolean,
    uploadInfo: {
      fileName: string;
      mimeType: string;
      totalChunks: number;
      chunkSize: number;
      totalSize: number;
      organizationId: string;
    }
  ): Promise<UploadProgress> {
    try {
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(chunkData)));

      const response = await apiService.post(
        `${this.baseUrl}/upload/chunked/chunk`,
        {
          uploadId,
          chunkNumber,
          chunkData: base64Data,
          isLastChunk,
          ...uploadInfo
        },
        {
          headers: { 'x-organization-id': uploadInfo.organizationId }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to upload chunk:', error);
      throw error;
    }
  }

  // Get upload progress
  async getUploadProgress(assetId: string, organizationId: string): Promise<UploadProgress> {
    try {
      const response = await apiService.get(`${this.baseUrl}/upload/${assetId}/progress`, {
        headers: { 'x-organization-id': organizationId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get upload progress:', error);
      throw error;
    }
  }

  // Update asset
  async updateAsset(
    assetId: string,
    organizationId: string,
    updateData: UpdateAssetData
  ): Promise<CreativeAsset> {
    try {
      const response = await apiService.put(
        `${this.baseUrl}/assets/${assetId}`,
        updateData,
        {
          headers: { 'x-organization-id': organizationId }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update asset:', error);
      throw error;
    }
  }

  // Delete asset
  async deleteAsset(assetId: string, organizationId: string): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/assets/${assetId}`, {
        headers: { 'x-organization-id': organizationId }
      });
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw error;
    }
  }

  // Archive asset
  async archiveAsset(assetId: string, organizationId: string): Promise<CreativeAsset> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/assets/${assetId}/archive`,
        {},
        {
          headers: { 'x-organization-id': organizationId }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to archive asset:', error);
      throw error;
    }
  }

  // Restore asset
  async restoreAsset(assetId: string, organizationId: string): Promise<CreativeAsset> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/assets/${assetId}/restore`,
        {},
        {
          headers: { 'x-organization-id': organizationId }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to restore asset:', error);
      throw error;
    }
  }

  // Get asset statistics
  async getAssetStats(organizationId: string): Promise<AssetStats> {
    try {
      const response = await apiService.get(`${this.baseUrl}/assets/stats`, {
        headers: { 'x-organization-id': organizationId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get asset stats:', error);
      throw error;
    }
  }

  // Search assets
  async searchAssets(
    organizationId: string,
    query: string,
    limit: number = 10
  ): Promise<CreativeAsset[]> {
    try {
      const response = await apiService.get(`${this.baseUrl}/assets/search`, {
        params: { q: query, limit },
        headers: { 'x-organization-id': organizationId }
      });
      return response.data.assets;
    } catch (error) {
      console.error('Failed to search assets:', error);
      throw error;
    }
  }

  // Resume interrupted upload
  async resumeUpload(
    uploadId: string,
    uploadedChunks: number[],
    organizationId: string
  ): Promise<{
    uploadId: string;
    missingChunks: number[];
    message: string;
  }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/upload/${uploadId}/resume`,
        { uploadedChunks },
        {
          headers: { 'x-organization-id': organizationId }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to resume upload:', error);
      throw error;
    }
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get asset type icon
  getAssetTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType === 'text/html') return '🌐';
    return '📄';
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

export const creativeAssetsService = new CreativeAssetsService(); 