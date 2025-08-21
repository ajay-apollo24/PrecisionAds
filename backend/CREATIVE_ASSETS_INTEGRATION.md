# Creative Assets Management - Integration Guide

## 🎯 Overview

This guide covers the complete integration of the Creative Assets Management system into your Precision Ads platform. The system provides comprehensive file upload, validation, processing, and management capabilities for advertising creative assets.

## ✅ What's Been Implemented

### Backend Infrastructure
- **Database Schema**: New Prisma models for CreativeAsset and CreativeAssetVersion
- **Core Services**: Upload, validation, processing, storage, and management services
- **API Routes**: RESTful endpoints for all asset operations
- **Type Definitions**: Comprehensive TypeScript interfaces

### Frontend Components
- **CreativeAssetManager**: Main dashboard component
- **AssetUpload**: Drag & drop file upload with progress tracking
- **AssetLibrary**: Asset browsing, filtering, and management
- **Service Layer**: Frontend service for API integration

## 🚀 Integration Steps

### 1. Database Setup

#### Option A: Using Prisma Migrations (Recommended)
```bash
cd backend
npx prisma migrate dev --name add-creative-assets
```

#### Option B: Manual SQL Migration
If Prisma migrations aren't working, run the SQL manually:

1. Connect to your PostgreSQL database
2. Execute the contents of `prisma/migrations/add-creative-assets.sql`
3. Verify the tables were created:
   ```sql
   \dt creative_assets
   \dt creative_asset_versions
   \d advertiser_ads
   ```

### 2. Backend Integration

#### Add Routes to Main App
In your main `app.ts` or `server.ts`:

```typescript
import { setupCreativeAssetRoutes } from './modules/creative-assets/routes';

// Add this line where you set up other routes
setupCreativeAssetRoutes(app, '/api');
```

#### Environment Variables
Add these to your `.env` file:

```env
# Creative Assets Configuration
CDN_BASE_URL=https://your-cdn.com
STORAGE_BUCKET=your-s3-bucket
CDN_SECRET=your-secret-key
TEMP_DIR=/tmp

# File Upload Limits
MAX_FILE_SIZE=104857600  # 100MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,text/html
```

### 3. Frontend Integration

The frontend components are already integrated into:
- `AdvertiserDashboard` - Added Creative Assets button
- `DashboardLayout` - Added Creative Assets tab
- Navigation system - Proper routing and state management

### 4. Test the Integration

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to Creative Assets**:
   - Login as an advertiser user
   - Click "Creative Assets" in the sidebar
   - Test file upload and management features

## 🔧 Configuration Options

### File Upload Settings
- **Max File Size**: 100MB (configurable)
- **Allowed Types**: Images (JPG, PNG, GIF, WebP), Videos (MP4, WebM), HTML5
- **Chunked Uploads**: For large files (configurable chunk size)

### Processing Options
- **Image Processing**: Resize, compress, format conversion
- **Video Processing**: Transcoding, thumbnail generation
- **HTML5 Processing**: Content validation, metadata extraction

### Storage Configuration
- **Local Storage**: Temporary file storage during processing
- **CDN Integration**: AWS S3 + CloudFront ready
- **Asset Versioning**: Multiple versions per asset

## 🧪 Testing

### Backend API Testing
```bash
# Test file upload
curl -X POST http://localhost:7401/api/creative-assets/upload \
  -F "file=@test-image.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-organization-id: YOUR_ORG_ID"

# Test asset listing
curl http://localhost:7401/api/creative-assets/assets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-organization-id: YOUR_ORG_ID"
```

### Frontend Testing
1. Upload various file types (images, videos, HTML)
2. Test drag & drop functionality
3. Verify progress tracking
4. Test asset management operations (edit, delete, archive)
5. Test search and filtering

## 🚨 Troubleshooting

### Common Issues

#### 1. Prisma Schema Validation Errors
```bash
# Validate schema
npx prisma validate

# Regenerate client
npx prisma generate
```

#### 2. Database Connection Issues
- Check database server is running
- Verify connection string in `.env`
- Check firewall/network settings

#### 3. File Upload Failures
- Verify file size limits
- Check MIME type restrictions
- Ensure temp directory is writable

#### 4. Frontend Component Errors
- Check browser console for errors
- Verify API endpoints are accessible
- Check authentication headers

### Debug Commands
```bash
# Check Prisma client
npx prisma studio

# Validate database schema
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Check database connection
npx prisma db execute --stdin
```

## 🔒 Security Considerations

### File Validation
- File type verification
- Size limit enforcement
- Content scanning (virus/malware)
- MIME type validation

### Access Control
- Organization-based isolation
- User permission checks
- Secure file storage
- CDN access controls

### Data Protection
- File hash verification
- Secure upload endpoints
- Input sanitization
- SQL injection prevention

## 📈 Performance Optimization

### Upload Optimization
- Chunked uploads for large files
- Progress tracking
- Resume capability
- Background processing

### Storage Optimization
- Image compression
- Format conversion
- CDN caching
- Asset versioning

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Caching strategies

## 🚀 Production Deployment

### CDN Setup
1. Configure AWS S3 bucket
2. Set up CloudFront distribution
3. Configure CORS policies
4. Set up proper IAM roles

### Monitoring
- File upload success rates
- Processing times
- Storage usage
- Error rates

### Scaling
- Load balancer configuration
- Database sharding
- CDN optimization
- Background job queues

## 📚 API Reference

### Endpoints
- `POST /api/creative-assets/upload` - File upload
- `GET /api/creative-assets/assets` - List assets
- `GET /api/creative-assets/assets/:id` - Get asset
- `PUT /api/creative-assets/assets/:id` - Update asset
- `DELETE /api/creative-assets/assets/:id` - Delete asset
- `POST /api/creative-assets/assets/:id/archive` - Archive asset

### Request/Response Formats
See the TypeScript interfaces in `src/modules/creative-assets/types/` for complete API specifications.

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor storage usage
- Clean up temporary files
- Update security policies
- Performance monitoring

### Version Updates
- Keep dependencies updated
- Monitor for security patches
- Test compatibility
- Plan migration strategies

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test with minimal configuration
4. Check GitHub issues (if applicable)

## 🎉 Success!

Once integrated, you'll have a fully functional Creative Assets Management system that:
- Handles multiple file types
- Provides excellent user experience
- Scales with your platform
- Integrates seamlessly with existing systems
- Maintains security and performance standards

The system is production-ready and can be enhanced with additional features like AI-powered content moderation, advanced analytics, and automated optimization. 