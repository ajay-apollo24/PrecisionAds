import { Express, Request, Response } from 'express';
import multer from 'multer';
import { AssetUploadService } from '../services/asset-upload.service';
import { FileUploadInfo } from '../types/upload.types';

interface UploadRequest extends Request {
  user: {
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
  user: {
    id: string;
    organizationId: string;
  };
}

export function setupAssetUploadRoutes(app: Express, prefix: string): void {
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
        req.user.organizationId,
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
  fastify.post('/upload/chunked/init', async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const { fileName, mimeType, totalSize, chunkSize } = request.body as any;
      
      if (!fileName || !mimeType || !totalSize || !chunkSize) {
        return reply.status(400).send({ 
          error: 'Missing required fields: fileName, mimeType, totalSize, chunkSize' 
        });
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(totalSize / chunkSize);

      return reply.status(200).send({
        uploadId,
        totalChunks,
        chunkSize,
        totalSize,
        fileName,
        mimeType
      });
    } catch (error) {
      console.error('Chunked upload init error:', error);
      return reply.status(500).send({ 
        error: 'Failed to initialize chunked upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload chunk
  fastify.post('/upload/chunked/chunk', async (request: ChunkedUploadRequest, reply: FastifyReply) => {
    try {
      const { 
        uploadId, 
        chunkNumber, 
        chunkData, 
        isLastChunk, 
        fileName, 
        mimeType, 
        totalChunks, 
        chunkSize, 
        totalSize 
      } = request.body;

      // Decode base64 chunk data
      const buffer = Buffer.from(chunkData, 'base64');

      const result = await uploadService.uploadChunkedAsset(
        {
          uploadId,
          chunkNumber,
          chunkData: buffer,
          isLastChunk
        },
        {
          uploadId,
          totalChunks,
          chunkSize,
          totalSize,
          fileName,
          mimeType,
          organizationId: request.user.organizationId
        }
      );

      return reply.status(200).send(result);
    } catch (error) {
      console.error('Chunk upload error:', error);
      return reply.status(500).send({ 
        error: 'Chunk upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get upload progress
  fastify.get('/upload/:assetId/progress', async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const { assetId } = request.params as { assetId: string };
      
      const progress = await uploadService.getUploadProgress(assetId);
      
      if (!progress) {
        return reply.status(404).send({ error: 'Asset not found' });
      }

      return reply.status(200).send(progress);
    } catch (error) {
      console.error('Progress check error:', error);
      return reply.status(500).send({ 
        error: 'Failed to get upload progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Resume interrupted upload
  fastify.post('/upload/:uploadId/resume', async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const { uploadId } = request.params as { uploadId: string };
      const { uploadedChunks } = request.body as { uploadedChunks: number[] };

      // In a real implementation, you would check which chunks are already uploaded
      // and return the missing chunks that need to be uploaded
      
      return reply.status(200).send({
        uploadId,
        missingChunks: [], // This would be calculated based on uploadedChunks
        message: 'Upload can be resumed'
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      return reply.status(500).send({ 
        error: 'Failed to resume upload',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 