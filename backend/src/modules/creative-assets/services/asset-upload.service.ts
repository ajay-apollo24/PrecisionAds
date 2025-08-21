import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { FileUploadInfo, UploadProgress, ChunkedUploadInfo, ChunkUploadData } from '../types/upload.types';
import { CreateAssetData, AssetUploadResponse, CreativeAssetStatus } from '../types/asset.types';
import { AssetValidationService } from './asset-validation.service';
import { AssetProcessingService } from './asset-processing.service';
import { AssetStorageService } from './asset-storage.service';

export class AssetUploadService {
  private prisma: PrismaClient;
  private validationService: AssetValidationService;
  private processingService: AssetProcessingService;
  private storageService: AssetStorageService;

  constructor() {
    this.prisma = new PrismaClient();
    this.validationService = new AssetValidationService();
    this.processingService = new AssetProcessingService();
    this.storageService = new AssetStorageService();
  }

  async uploadAsset(
    file: FileUploadInfo,
    organizationId: string,
    assetName?: string
  ): Promise<AssetUploadResponse> {
    try {
      // Generate file hash for deduplication
      const fileHash = createHash('sha256').update(file.buffer).digest('hex');
      
      // Check for duplicate assets
      const existingAsset = await this.prisma.creativeAsset.findFirst({
        where: {
          fileHash,
          organizationId
        }
      });

      if (existingAsset) {
        return {
          assetId: existingAsset.id,
          status: existingAsset.status,
          message: 'Asset already exists with the same content'
        };
      }

      // Create asset record
      const asset = await this.prisma.creativeAsset.create({
        data: {
          organizationId,
          name: assetName || file.originalname,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileHash,
          status: 'PENDING',
          localPath: file.path
        }
      });

      // Start async processing
      this.processAssetAsync(asset.id, file);

      return {
        assetId: asset.id,
        status: 'PENDING',
        message: 'Asset uploaded successfully and queued for processing'
      };
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw new Error('Failed to upload asset');
    }
  }

  async uploadChunkedAsset(
    chunkData: ChunkUploadData,
    uploadInfo: ChunkedUploadInfo
  ): Promise<UploadProgress> {
    try {
      // Implementation for chunked uploads
      // This would handle large file uploads in chunks
      const tempPath = path.join(process.env.TEMP_DIR || '/tmp', uploadInfo.uploadId);
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      
      // Append chunk to temp file
      await fs.appendFile(tempPath, chunkData.chunkData);
      
      if (chunkData.isLastChunk) {
        // Complete the upload
        const stats = await fs.stat(tempPath);
        const buffer = await fs.readFile(tempPath);
        
        // Create asset record
        const asset = await this.prisma.creativeAsset.create({
          data: {
            organizationId: uploadInfo.organizationId,
            name: uploadInfo.fileName,
            fileName: uploadInfo.fileName,
            fileSize: stats.size,
            mimeType: uploadInfo.mimeType,
            fileHash: createHash('sha256').update(buffer).digest('hex'),
            status: 'PENDING',
            localPath: tempPath
          }
        });

        // Start processing
        this.processAssetAsync(asset.id, {
          buffer,
          path: tempPath,
          size: stats.size,
          mimetype: uploadInfo.mimeType,
          originalname: uploadInfo.fileName
        } as FileUploadInfo);

        // Clean up temp file
        await fs.unlink(tempPath);

        return {
          assetId: asset.id,
          progress: 100,
          status: 'completed',
          message: 'Asset uploaded successfully'
        };
      }

      return {
        assetId: uploadInfo.uploadId,
        progress: (chunkData.chunkNumber / uploadInfo.totalChunks) * 100,
        status: 'uploading',
        message: `Chunk ${chunkData.chunkNumber} uploaded`
      };
    } catch (error) {
      console.error('Error uploading chunk:', error);
      throw new Error('Failed to upload chunk');
    }
  }

  private async processAssetAsync(assetId: string, file: FileUploadInfo): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.creativeAsset.update({
        where: { id: assetId },
        data: { status: 'PROCESSING' }
      });

      // Validate asset
      const validationResult = await this.validationService.validateAsset(file);
      
      if (!validationResult.isValid) {
        await this.prisma.creativeAsset.update({
          where: { id: assetId },
          data: {
            status: 'REJECTED',
            validationErrors: validationResult.errors
          }
        });
        return;
      }

      // Process asset (resize, compress, etc.)
      const processedAsset = await this.processingService.processAsset(file, assetId);
      
      // Store in CDN
      const cdnUrl = await this.storageService.storeAsset(processedAsset, assetId);
      
      // Update asset with CDN URL and mark as validated
      await this.prisma.creativeAsset.update({
        where: { id: assetId },
        data: {
          status: 'VALIDATED',
          cdnUrl,
          dimensions: processedAsset.dimensions,
          duration: processedAsset.duration,
          metadata: processedAsset.metadata
        }
      });

      // Clean up local file
      if (file.path && file.path !== processedAsset.path) {
        await fs.unlink(file.path).catch(() => {});
      }
    } catch (error) {
      console.error('Error processing asset:', error);
      await this.prisma.creativeAsset.update({
        where: { id: assetId },
        data: {
          status: 'REJECTED',
          validationErrors: ['Processing failed: ' + error.message]
        }
      });
    }
  }

  async getUploadProgress(assetId: string): Promise<UploadProgress | null> {
    const asset = await this.prisma.creativeAsset.findUnique({
      where: { id: assetId }
    });

    if (!asset) return null;

    let progress = 0;
    let status: UploadProgress['status'] = 'uploading';
    let message = '';

    switch (asset.status) {
      case 'PENDING':
        progress = 25;
        status = 'uploading';
        message = 'Asset uploaded, waiting for processing';
        break;
      case 'PROCESSING':
        progress = 50;
        status = 'processing';
        message = 'Processing asset...';
        break;
      case 'VALIDATED':
        progress = 100;
        status = 'completed';
        message = 'Asset processed successfully';
        break;
      case 'REJECTED':
        progress = 0;
        status = 'failed';
        message = 'Asset validation failed';
        break;
      default:
        progress = 0;
        status = 'uploading';
        message = 'Unknown status';
    }

    return {
      assetId: asset.id,
      progress,
      status,
      message,
      error: asset.validationErrors ? asset.validationErrors.join(', ') : undefined
    };
  }
} 