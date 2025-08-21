# Creative Assets Management System

This document describes the new Creative Assets Management System for the PrecisionAds advertiser module.

## Overview

The Creative Assets Management System replaces the previous URL-based creative management with a comprehensive asset library that provides:

- **Asset Upload & Validation**: Drag-and-drop file uploads with automatic validation
- **Asset Library**: Organized storage with search, filtering, and categorization
- **Asset Preview**: Visual preview of images, videos, and HTML5 assets
- **Campaign Integration**: Seamless asset selection in campaign creation
- **Performance Tracking**: Asset-level analytics and performance metrics

## Components

### 1. CreativeAssetsPage
The main entry point for creative assets management.

**Features:**
- Dashboard with asset statistics
- Tabbed interface for different functions
- Quick access to upload and management tools

**Usage:**
```tsx
import { CreativeAssetsPage } from './components/advertiser';

<CreativeAssetsPage organizationId="org-123" />
```

### 2. CreativeAssetManager
Core component for managing the asset library.

**Features:**
- Asset library with grid/list views
- Search and filtering capabilities
- Asset upload interface
- Asset preview functionality

**Usage:**
```tsx
import { CreativeAssetManager } from './components/advertiser';

<CreativeAssetManager
  organizationId="org-123"
  onAssetSelect={handleAssetSelect}
  onAssetUpload={handleAssetUpload}
/>
```

### 3. AssetUpload
Handles file uploads with drag-and-drop support.

**Features:**
- Drag-and-drop file uploads
- File validation (type, size, format)
- Upload progress tracking
- Batch upload support

**Usage:**
```tsx
import { AssetUpload } from './components/advertiser';

<AssetUpload
  organizationId="org-123"
  onUploadComplete={handleUploadComplete}
/>
```

### 4. AssetLibrary
Displays assets in organized grid or list views.

**Features:**
- Grid and list view modes
- Asset filtering by type and status
- Asset actions (view, edit, delete, download)
- Responsive design

**Usage:**
```tsx
import { AssetLibrary } from './components/advertiser';

<AssetLibrary
  assets={assets}
  loading={loading}
  viewMode="grid"
  onAssetSelect={handleAssetSelect}
/>
```

### 5. AssetPreview
Provides detailed asset information and preview.

**Features:**
- Visual asset preview
- Detailed metadata display
- Asset actions (download, edit, delete)
- Usage statistics

**Usage:**
```tsx
import { AssetPreview } from './components/advertiser';

<AssetPreview asset={selectedAsset} />
```

### 6. AssetSelector
Integrates asset selection into campaign forms.

**Features:**
- Modal asset selection interface
- Type-based filtering
- Visual asset representation
- Seamless form integration

**Usage:**
```tsx
import { AssetSelector } from './components/advertiser';

<AssetSelector
  organizationId="org-123"
  selectedAssetId={campaign.creativeAssetId}
  onAssetSelect={handleAssetSelect}
  creativeType="IMAGE"
/>
```

## Integration with Campaigns

### Before (URL-based)
```tsx
// Old approach - manual URL entry
<Input
  placeholder="Creative URL"
  value={campaign.creativeUrl}
  onChange={(e) => setCampaign({ ...campaign, creativeUrl: e.target.value })}
/>
```

### After (Asset-based)
```tsx
// New approach - asset selection
<AssetSelector
  organizationId={organizationId}
  selectedAssetId={campaign.creativeAssetId}
  onAssetSelect={(asset) => setCampaign({ ...campaign, creativeAssetId: asset?.id })}
  creativeType={campaign.type}
/>
```

## Asset Types Supported

### Images
- **Formats**: JPEG, PNG, GIF, WebP
- **Max Size**: 50MB
- **Features**: Automatic dimension detection, format validation

### Videos
- **Formats**: MP4, WebM, OGG
- **Max Size**: 50MB
- **Features**: Duration detection, thumbnail generation

### HTML5
- **Formats**: HTML, ZIP (packaged)
- **Max Size**: 50MB
- **Features**: Preview in new tab, dimension validation

### Text
- **Formats**: Plain text, rich text
- **Max Size**: 1MB
- **Features**: Content validation, character limits

## Asset Statuses

- **PENDING**: Uploaded, awaiting processing
- **PROCESSING**: Being validated and optimized
- **VALIDATED**: Ready for use in campaigns
- **REJECTED**: Failed validation or policy compliance
- **ARCHIVED**: No longer active

## File Validation Rules

### Size Limits
- Images: 50MB max
- Videos: 50MB max
- HTML5: 50MB max
- Text: 1MB max

### Format Validation
- Automatic MIME type detection
- File extension validation
- Content integrity checks

### Content Policy
- Brand safety scanning
- Inappropriate content detection
- Policy compliance validation

## Performance Features

### CDN Integration
- Automatic asset distribution
- Geographic optimization
- Cache management
- Load time optimization

### Asset Optimization
- Image compression
- Video transcoding
- Format conversion
- Thumbnail generation

## Analytics & Reporting

### Asset Performance
- Impression tracking
- Click-through rates
- Conversion metrics
- Performance scoring

### Campaign Integration
- Asset usage across campaigns
- Performance comparison
- ROI analysis
- A/B testing support

## Security Features

### Access Control
- Organization-level isolation
- User permission management
- Asset sharing controls
- Audit logging

### Content Security
- Virus scanning
- Malware detection
- Content validation
- Secure file storage

## Future Enhancements

### Planned Features
- AI-powered asset optimization
- Automated creative generation
- Advanced targeting integration
- Real-time performance monitoring

### API Integration
- RESTful asset management API
- Webhook notifications
- Third-party integrations
- Bulk operations support

## Getting Started

### 1. Add to Routes
```tsx
// In your routing configuration
import { CreativeAssetsPage } from './components/advertiser';

<Route path="/creative-assets" element={<CreativeAssetsPage organizationId={orgId} />} />
```

### 2. Update Campaign Forms
```tsx
// Replace URL inputs with AssetSelector
import { AssetSelector } from './components/advertiser';

// Old
<Input placeholder="Creative URL" />

// New
<AssetSelector
  organizationId={organizationId}
  onAssetSelect={handleAssetSelect}
  creativeType={campaignType}
/>
```

### 3. Handle Asset Selection
```tsx
const handleAssetSelect = (asset: CreativeAsset | null) => {
  if (asset) {
    setCampaign(prev => ({
      ...prev,
      creativeAssetId: asset.id,
      creativeUrl: asset.cdnUrl // Fallback for backward compatibility
    }));
  }
};
```

## Troubleshooting

### Common Issues

1. **Assets not loading**
   - Check organization ID
   - Verify API endpoints
   - Check network connectivity

2. **Upload failures**
   - Verify file size limits
   - Check supported formats
   - Ensure proper permissions

3. **Preview not working**
   - Check CDN configuration
   - Verify asset status
   - Check browser compatibility

### Debug Mode
Enable debug logging by setting:
```tsx
localStorage.setItem('debug', 'creative-assets');
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Contributing

To contribute to the Creative Assets Management System:

1. Follow the existing code style
2. Add comprehensive tests
3. Update documentation
4. Submit pull requests

## License

This system is part of the PrecisionAds platform and follows the same licensing terms. 