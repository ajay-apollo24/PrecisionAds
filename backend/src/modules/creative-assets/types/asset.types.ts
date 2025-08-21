export type CreativeAssetStatus = 'PENDING' | 'PROCESSING' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';

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
  status?: CreativeAssetStatus;
  validationErrors?: string[];
  metadata?: Record<string, any>;
  cdnUrl?: string;
}

export interface AssetFilters {
  status?: CreativeAssetStatus;
  mimeType?: string;
  organizationId?: string;
  search?: string;
}

export interface AssetWithRelations {
  id: string;
  organizationId: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  } | null;
  duration: number | null;
  fileHash: string;
  cdnUrl: string | null;
  localPath: string | null;
  status: CreativeAssetStatus;
  validationErrors: string[] | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  organization: {
    id: string;
    name: string;
  };
  assetVersions: AssetVersion[];
  ads: {
    id: string;
    name: string;
    campaignId: string;
  }[];
}

export interface AssetVersion {
  id: string;
  assetId: string;
  version: number;
  filePath: string;
  cdnUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AssetUploadResponse {
  assetId: string;
  status: CreativeAssetStatus;
  message: string;
  validationErrors?: string[];
}

export interface AssetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface AssetProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  compress?: {
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  };
  generateThumbnail?: boolean;
  extractMetadata?: boolean;
} 