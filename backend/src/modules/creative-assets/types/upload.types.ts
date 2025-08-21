export interface FileUploadInfo {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface UploadProgress {
  assetId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'validating' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface ChunkedUploadInfo {
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
  totalSize: number;
  fileName: string;
  mimeType: string;
  organizationId: string;
}

export interface ChunkUploadData {
  uploadId: string;
  chunkNumber: number;
  chunkData: Buffer;
  isLastChunk: boolean;
}

export interface MultipartUploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  maxConcurrentUploads: number;
  chunkSize: number; // in bytes
  tempDirectory: string;
} 