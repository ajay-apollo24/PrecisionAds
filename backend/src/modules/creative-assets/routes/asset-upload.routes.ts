import { Express, Request, Response } from 'express';
import multer from 'multer';
import { AssetUploadService } from '../services/asset-upload.service';
import { FileUploadInfo } from '../types/upload.types';

interface UploadRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
  };
}

interface ChunkedUploadRequest extends Request {
  body: {
    uploadId: string;
    chunkNumber: number;
    chunkData: string; // base64 encoded
    isLastChunk: boolean;
    fileName: string;
    mimeType: string;
    totalChunks: number;
    chunkSize: number;
    totalSize: number;
  };
  user?: {
    id: string;
    organizationId: string;
  };
}

export function setupAssetUploadRoutes(app: Express, prefix: string): void {
  console.log(`Setting up asset upload routes at ${prefix}`);
  
  const uploadService = new AssetUploadService();

  // Configure multer for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 1
    }
  });

  // Single file upload
  app.post(`${prefix}/upload`, upload.single('file'), async (req: UploadRequest, res: Response) => {
    try {
      const file = req.file;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const fileInfo: FileUploadInfo = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        destination: '/tmp',
        filename: file.originalname,
        path: '/tmp/' + file.originalname,
        buffer: file.buffer
      };

      const result = await uploadService.uploadAsset(
        fileInfo,
        organizationId,
        req.body?.assetName
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ 
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Initialize chunked upload
  app.post(`${prefix}/upload/chunked/init`, async (req: ChunkedUploadRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { fileName, mimeType, totalSize, chunkSize } = req.body;
      
      if (!fileName || !mimeType || !totalSize || !chunkSize) {
        return res.status(400).json({ 
          error: 'Missing required fields: fileName, mimeType, totalSize, chunkSize' 
        });
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(totalSize / chunkSize);

      return res.status(200).json({
        uploadId,
        totalChunks,
        chunkSize,
        totalSize,
        fileName,
        mimeType
      });
    } catch (error) {
      console.error('Chunked upload init error:', error);
      return res.status(500).json({ 
        error: 'Failed to initialize chunked upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload chunk
  app.post(`${prefix}/upload/chunked/chunk`, async (req: ChunkedUploadRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { uploadId, chunkNumber, chunkData, isLastChunk } = req.body;
      
      if (!uploadId || chunkNumber === undefined || !chunkData) {
        return res.status(400).json({ 
          error: 'Missing required fields: uploadId, chunkNumber, chunkData' 
        });
      }

      // Simulate chunk processing
      console.log(`Processing chunk ${chunkNumber} for upload ${uploadId}`);
      
      if (isLastChunk) {
        // Simulate finalizing upload
        const result = await uploadService.uploadChunkedAsset(
          { uploadId, chunkNumber, chunkData: Buffer.from(chunkData, 'base64'), isLastChunk },
          { uploadId, totalChunks: 1, chunkSize: 1024, totalSize: 1024, fileName: 'chunked-file', mimeType: 'application/octet-stream', organizationId: req.user.organizationId }
        );
        return res.status(200).json(result);
      }

      return res.status(200).json({ 
        message: `Chunk ${chunkNumber} uploaded successfully`,
        uploadId,
        chunkNumber
      });
    } catch (error) {
      console.error('Chunk upload error:', error);
      return res.status(500).json({ 
        error: 'Failed to upload chunk',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get upload status
  app.get(`${prefix}/upload/:uploadId/status`, async (req: UploadRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { uploadId } = req.params;
      
      if (!uploadId) {
        return res.status(400).json({ error: 'Upload ID required' });
      }

      // Simulate getting upload status
      const status = await uploadService.getUploadProgress(uploadId);
      
      return res.status(200).json(status);
    } catch (error) {
      console.error('Get upload status error:', error);
      return res.status(500).json({ 
        error: 'Failed to get upload status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cancel upload
  app.delete(`${prefix}/upload/:uploadId`, async (req: UploadRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { uploadId } = req.params;
      
      if (!uploadId) {
        return res.status(400).json({ error: 'Upload ID required' });
      }

      // Simulate canceling upload - just return success for now
      console.log(`Cancelling upload ${uploadId}`);
      
      return res.status(200).json({ 
        message: 'Upload cancelled successfully',
        uploadId
      });
    } catch (error) {
      console.error('Cancel upload error:', error);
      return res.status(500).json({ 
        error: 'Failed to cancel upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 