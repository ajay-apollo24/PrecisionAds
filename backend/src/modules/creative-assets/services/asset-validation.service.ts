import { FileUploadInfo } from '../types/upload.types';
import { AssetValidationResult } from '../types/asset.types';

export class AssetValidationService {
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'text/html',
    'application/x-shockwave-flash'
  ];

  private readonly maxDimensions = {
    width: 3000,
    height: 3000
  };

  private readonly minDimensions = {
    width: 100,
    height: 100
  };

  async validateAsset(file: FileUploadInfo): Promise<AssetValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // File size validation
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // MIME type validation
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not supported`);
    }

    // File extension validation
    const extension = this.getFileExtension(file.originalname);
    if (!this.isValidExtension(extension, file.mimetype)) {
      errors.push(`File extension .${extension} does not match MIME type ${file.mimetype}`);
    }

    // Content validation based on MIME type
    if (file.mimetype.startsWith('image/')) {
      const imageValidation = await this.validateImage(file);
      errors.push(...imageValidation.errors);
      warnings.push(...imageValidation.warnings);
      recommendations.push(...imageValidation.recommendations);
    } else if (file.mimetype.startsWith('video/')) {
      const videoValidation = await this.validateVideo(file);
      errors.push(...videoValidation.errors);
      warnings.push(...videoValidation.warnings);
      recommendations.push(...videoValidation.recommendations);
    } else if (file.mimetype === 'text/html') {
      const htmlValidation = await this.validateHTML(file);
      errors.push(...htmlValidation.errors);
      warnings.push(...htmlValidation.warnings);
      recommendations.push(...htmlValidation.recommendations);
    }

    // Performance recommendations
    if (file.size > 5 * 1024 * 1024) { // 5MB
      recommendations.push('Consider compressing this asset for better loading performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  private async validateImage(file: FileUploadInfo): Promise<AssetValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Basic image validation - in a real implementation, you'd use a library like sharp
      // to get actual dimensions and validate the image
      
      // For now, we'll do basic checks
      if (file.size > 10 * 1024 * 1024) { // 10MB for images
        warnings.push('Image file is quite large, consider compression');
      }

      // Add recommendations for common image formats
      if (file.mimetype === 'image/jpeg') {
        recommendations.push('JPEG is good for photographs, consider WebP for better compression');
      } else if (file.mimetype === 'image/png') {
        recommendations.push('PNG is good for graphics with transparency, consider WebP for better compression');
      }

    } catch (error) {
      errors.push('Failed to validate image file');
    }

    return { isValid: errors.length === 0, errors, warnings, recommendations };
  }

  private async validateVideo(file: FileUploadInfo): Promise<AssetValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Video file size validation
    if (file.size > 50 * 1024 * 1024) { // 50MB for videos
      warnings.push('Video file is large, consider compression or lower resolution');
    }

    // Video format recommendations
    if (file.mimetype === 'video/mp4') {
      recommendations.push('MP4 is widely supported, consider WebM for better compression');
    }

    return { isValid: errors.length === 0, errors, warnings, recommendations };
  }

  private async validateHTML(file: FileUploadInfo): Promise<AssetValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // HTML file validation
    if (file.size > 1 * 1024 * 1024) { // 1MB for HTML
      warnings.push('HTML file is quite large, consider optimizing');
    }

    // Check for common HTML issues
    const content = file.buffer.toString('utf-8');
    if (content.includes('<script>')) {
      warnings.push('HTML contains scripts, ensure they comply with ad network policies');
    }

    if (content.includes('http://')) {
      recommendations.push('Consider using HTTPS URLs for better security');
    }

    return { isValid: errors.length === 0, errors, warnings, recommendations };
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private isValidExtension(extension: string, mimeType: string): boolean {
    const extensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'image/svg+xml': ['svg'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'video/ogg': ['ogv', 'ogg'],
      'text/html': ['html', 'htm'],
      'application/x-shockwave-flash': ['swf']
    };

    const allowedExtensions = extensionMap[mimeType] || [];
    return allowedExtensions.includes(extension);
  }
} 