import { FileUploadInfo } from '../types/upload.types';
import { AssetProcessingOptions } from '../types/asset.types';
import { promises as fs } from 'fs';
import path from 'path';

export interface ProcessedAsset {
  path: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  metadata?: Record<string, any>;
  fileSize: number;
  mimeType: string;
}

export class AssetProcessingService {
  private readonly tempDir = process.env.TEMP_DIR || '/tmp';

  async processAsset(
    file: FileUploadInfo,
    assetId: string,
    options?: AssetProcessingOptions
  ): Promise<ProcessedAsset> {
    try {
      const outputPath = path.join(this.tempDir, `processed_${assetId}_${Date.now()}`);
      
      if (file.mimetype.startsWith('image/')) {
        return await this.processImage(file, outputPath, options);
      } else if (file.mimetype.startsWith('video/')) {
        return await this.processVideo(file, outputPath, options);
      } else if (file.mimetype === 'text/html') {
        return await this.processHTML(file, outputPath, options);
      } else {
        // For unsupported types, just copy the file
        await fs.copyFile(file.path, outputPath);
        return {
          path: outputPath,
          fileSize: file.size,
          mimeType: file.mimetype
        };
      }
    } catch (error) {
      console.error('Error processing asset:', error);
      throw new Error(`Failed to process asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processImage(
    file: FileUploadInfo,
    outputPath: string,
    options?: AssetProcessingOptions
  ): Promise<ProcessedAsset> {
    try {
      // In a production environment, you would use Sharp or similar library
      // For now, we'll simulate the processing
      
      let processedPath = file.path;
      let dimensions = { width: 800, height: 600 }; // Default dimensions
      let fileSize = file.size;

      // Simulate resizing if options are provided
      if (options?.resize) {
        if (options.resize.width && options.resize.height) {
          dimensions = {
            width: options.resize.width,
            height: options.resize.height
          };
        } else if (options.resize.width) {
          dimensions.height = Math.round((dimensions.height * options.resize.width) / dimensions.width);
          dimensions.width = options.resize.width;
        } else if (options.resize.height) {
          dimensions.width = Math.round((dimensions.width * options.resize.height) / dimensions.height);
          dimensions.height = options.resize.height;
        }
      }

      // Simulate compression
      if (options?.compress) {
        fileSize = Math.round(fileSize * 0.7); // Simulate 30% compression
      }

      // Copy to output path
      await fs.copyFile(file.path, outputPath);

      return {
        path: outputPath,
        dimensions,
        fileSize,
        mimeType: file.mimetype,
        metadata: {
          originalDimensions: { width: 800, height: 600 },
          processedDimensions: dimensions,
          compressionRatio: fileSize / file.size
        }
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processVideo(
    file: FileUploadInfo,
    outputPath: string,
    options?: AssetProcessingOptions
  ): Promise<ProcessedAsset> {
    try {
      // In a production environment, you would use FFmpeg
      // For now, we'll simulate the processing
      
      let processedPath = file.path;
      let duration = 30; // Default duration in seconds
      let fileSize = file.size;

      // Simulate video processing
      if (options?.resize) {
        // Simulate resolution change
        fileSize = Math.round(fileSize * 0.8); // Simulate 20% size reduction
      }

      // Copy to output path
      await fs.copyFile(file.path, outputPath);

      return {
        path: outputPath,
        duration,
        fileSize,
        mimeType: file.mimetype,
        metadata: {
          originalSize: file.size,
          processedSize: fileSize,
          duration,
          codec: 'H.264',
          bitrate: '2Mbps'
        }
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processHTML(
    file: FileUploadInfo,
    outputPath: string,
    options?: AssetProcessingOptions
  ): Promise<ProcessedAsset> {
    try {
      let content = file.buffer.toString('utf-8');
      let fileSize = file.size;

      // Basic HTML optimization
      if (options?.extractMetadata) {
        // Extract title, meta tags, etc.
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const metaTags = content.match(/<meta[^>]+>/g);
        
        if (titleMatch || metaTags) {
          content = `<!-- Original file: ${file.originalname} -->\n${content}`;
          fileSize = Buffer.byteLength(content, 'utf-8');
        }
      }

      // Write processed HTML
      await fs.writeFile(outputPath, content, 'utf-8');

      return {
        path: outputPath,
        fileSize,
        mimeType: file.mimetype,
        metadata: {
          hasTitle: content.includes('<title>'),
          hasMetaTags: content.includes('<meta'),
          lineCount: content.split('\n').length
        }
      };
    } catch (error) {
      console.error('Error processing HTML:', error);
      throw new Error(`Failed to process HTML: ${error.message}`);
    }
  }

  async generateThumbnail(
    file: FileUploadInfo,
    assetId: string,
    width: number = 200,
    height: number = 200
  ): Promise<string> {
    try {
      const thumbnailPath = path.join(this.tempDir, `thumb_${assetId}_${Date.now()}.jpg`);
      
      if (file.mimetype.startsWith('image/')) {
        // In production, use Sharp to generate thumbnail
        // For now, just copy the original file
        await fs.copyFile(file.path, thumbnailPath);
      } else if (file.mimetype.startsWith('video/')) {
        // In production, use FFmpeg to extract video frame
        // For now, create a placeholder
        await fs.writeFile(thumbnailPath, 'Video thumbnail placeholder');
      } else {
        // Create a placeholder for other file types
        await fs.writeFile(thumbnailPath, 'File thumbnail placeholder');
      }

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  async cleanupTempFiles(filePath: string): Promise<void> {
    try {
      if (filePath && filePath.startsWith(this.tempDir)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }
} 