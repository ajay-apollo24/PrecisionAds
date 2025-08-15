# Data Tracking and Logging System

## Overview

This document explains how publisher sites share clicks, impressions, and transaction data with the Precision Ads platform, and details the comprehensive error and audit logging system.

## Publisher Site Data Sharing

### 1. Data Flow Architecture

Publisher sites integrate with the Precision Ads platform through several key endpoints:

```
Publisher Site → Ad Request → Ad Serving → Tracking Events → Analytics & Reporting
```

### 2. Integration Points

#### A. Ad Request Endpoint
- **URL**: `POST /api/ad-serving/request`
- **Purpose**: Request an ad for display on a publisher site
- **Data Sent**:
  - `siteId`: Publisher site identifier
  - `adUnitId`: Ad unit placement identifier
  - `requestId`: Unique request identifier
  - `userAgent`: Browser information
  - `ipAddress`: User IP address
  - `geoLocation`: Geographic location data
  - `deviceInfo`: Device characteristics
  - `targeting`: Audience targeting parameters

#### B. Impression Tracking
- **URL**: `POST /api/publisher/tracking/impression`
- **Purpose**: Track when an ad is displayed to a user
- **Data Sent**:
  - `requestId`: Original ad request ID
  - `siteId`: Publisher site ID
  - `adUnitId`: Ad unit ID
  - `adId`: Served ad ID
  - `viewability`: Ad viewability score (0-100)
  - `viewTime`: Time ad was visible (seconds)
  - `viewport`: Browser viewport dimensions
  - `geoLocation`: User location data
  - `deviceInfo`: Device characteristics

#### C. Click Tracking
- **URL**: `POST /api/publisher/tracking/click`
- **Purpose**: Track when a user clicks on an ad
- **Data Sent**:
  - `requestId`: Original ad request ID
  - `siteId`: Publisher site ID
  - `adUnitId`: Ad unit ID
  - `adId`: Clicked ad ID
  - `clickPosition`: X,Y coordinates of click
  - `referrer`: Referring page URL
  - `landingPageUrl`: Ad destination URL

#### D. Conversion Tracking
- **URL**: `POST /api/publisher/tracking/conversion`
- **Purpose**: Track user actions after clicking an ad
- **Data Sent**:
  - `requestId`: Original ad request ID
  - `siteId`: Publisher site ID
  - `adUnitId`: Ad unit ID
  - `adId`: Ad ID
  - `transactionId`: Unique transaction ID
  - `amount`: Transaction value
  - `currency`: Transaction currency
  - `conversionType`: Type of conversion (purchase, signup, download, etc.)

#### E. Batch Tracking
- **URL**: `POST /api/publisher/tracking/batch`
- **Purpose**: Send multiple tracking events in a single request
- **Data Sent**:
  - `events`: Array of tracking events (impressions, clicks, conversions)

### 3. Data Collection Methods

#### A. JavaScript Integration
```javascript
// Example publisher site integration
<script>
// Track impression
fetch('/api/publisher/tracking/impression', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId: 'req_123',
    siteId: 'site_456',
    adUnitId: 'unit_789',
    adId: 'ad_101',
    viewability: 85,
    viewTime: 15,
    viewport: { width: 1920, height: 1080 }
  })
});

// Track click
fetch('/api/publisher/tracking/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId: 'req_123',
    siteId: 'site_456',
    adUnitId: 'unit_789',
    adId: 'ad_101',
    clickPosition: { x: 150, y: 200 }
  })
});
</script>
```

#### B. Server-to-Server Integration
```bash
# Example server-side tracking
curl -X POST /api/publisher/tracking/impression \
  -H "Content-Type: application/json" \
  -H "X-Organization-ID: org_123" \
  -d '{
    "requestId": "req_123",
    "siteId": "site_456",
    "adUnitId": "unit_789",
    "adId": "ad_101"
  }'
```

### 4. Data Processing Pipeline

1. **Data Ingestion**: Tracking endpoints receive data from publisher sites
2. **Validation**: Input data is validated for required fields and format
3. **Enrichment**: Additional context is added (timestamps, IP geolocation)
4. **Storage**: Data is stored in appropriate database tables
5. **Aggregation**: Daily metrics are calculated and stored
6. **Analytics**: Data is processed for reporting and insights

## Comprehensive Logging System

### 1. Logging Architecture

The system uses Winston for structured logging with multiple specialized loggers:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Logger   │    │  Audit Logger   │    │ Performance     │
│                 │    │                 │    │ Logger          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Console Logs   │    │  Audit Files    │    │ Performance    │
│  Error Files    │    │  (30 days)      │    │ Files          │
│  Combined Files │    │                 │    │ (14 days)      │
│  (14 days)      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Logger Types

#### A. Main Logger (`logger`)
- **Purpose**: General application logging
- **Levels**: error, warn, info, debug
- **Outputs**: Console, error files, combined files
- **Retention**: 14 days for most files

#### B. Audit Logger (`auditLogger`)
- **Purpose**: Business event tracking
- **Events**: User actions, CRUD operations, financial transactions
- **Retention**: 30 days
- **Use Cases**: Compliance, security, business intelligence

#### C. Performance Logger (`performanceLogger`)
- **Purpose**: System performance metrics
- **Metrics**: API response times, database query times
- **Retention**: 14 days
- **Use Cases**: Performance monitoring, capacity planning

#### D. Database Logger (`dbLogger`)
- **Purpose**: Database operation tracking
- **Data**: Query execution times, parameters, results
- **Retention**: 14 days
- **Use Cases**: Query optimization, performance analysis

#### E. Request Logger (`requestLogger`)
- **Purpose**: HTTP request/response logging
- **Data**: Request details, response times, status codes
- **Retention**: 7 days
- **Use Cases**: API monitoring, debugging

### 3. Logging Features

#### A. Structured Logging
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Ad impression tracked",
  "metadata": {
    "service": "precision-ads-audit",
    "event": "AD_SERVING",
    "userId": "user_123",
    "action": "impression_tracked",
    "resourceType": "AD_IMPRESSION",
    "resourceId": "req_456",
    "details": {
      "adId": "ad_789",
      "siteId": "site_101",
      "viewability": 85
    }
  }
}
```

#### B. Log Rotation
- **File Size**: Maximum 20MB per file
- **Daily Rotation**: New log file each day
- **Automatic Cleanup**: Old files automatically removed
- **Compression**: Old logs can be compressed

#### C. Performance Monitoring
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Performance metric",
  "metadata": {
    "metric": "impression_tracking_duration",
    "value": 45,
    "unit": "ms",
    "category": "AD_SERVING",
    "tags": {
      "siteId": "site_123",
      "adId": "ad_456"
    }
  }
}
```

### 4. Audit Trail

#### A. Business Events
- **Authentication**: Login, logout, failed login attempts
- **CRUD Operations**: Create, read, update, delete operations
- **Ad Serving**: Impression, click, conversion tracking
- **Financial**: Revenue, spending, conversion tracking

#### B. Security Events
- **Access Control**: Permission checks, authorization failures
- **Data Access**: Sensitive data access patterns
- **System Changes**: Configuration modifications, system updates

#### C. Compliance Events
- **Data Privacy**: GDPR compliance, data retention
- **Financial**: Revenue tracking, payment processing
- **Regulatory**: Industry-specific compliance requirements

### 5. Error Handling and Logging

#### A. Error Types
- **Operational Errors**: Expected errors (validation failures, not found)
- **System Errors**: Unexpected errors (database failures, network issues)
- **Security Errors**: Authentication/authorization failures

#### B. Error Logging
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "metadata": {
    "error": "Connection timeout",
    "stack": "Error stack trace...",
    "url": "/api/publisher/tracking/impression",
    "method": "POST",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 6. Monitoring and Alerting

#### A. Key Metrics
- **API Response Times**: 95th percentile response times
- **Error Rates**: Error percentage by endpoint
- **Database Performance**: Query execution times
- **System Resources**: CPU, memory, disk usage

#### B. Alerting Rules
- **High Error Rate**: >5% error rate for any endpoint
- **Slow Response**: >2 second response time
- **Database Issues**: >1 second query execution time
- **System Resources**: >80% CPU or memory usage

## Implementation Examples

### 1. Publisher Site Integration

```html
<!-- Publisher site HTML -->
<!DOCTYPE html>
<html>
<head>
    <title>Publisher Site</title>
</head>
<body>
    <div id="ad-unit-1" data-site-id="site_123" data-ad-unit-id="unit_456"></div>
    
    <script>
        // Ad request
        async function requestAd(adUnitId) {
            const response = await fetch('/api/ad-serving/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: 'site_123',
                    adUnitId: adUnitId,
                    requestId: generateRequestId(),
                    userAgent: navigator.userAgent,
                    deviceInfo: getDeviceInfo()
                })
            });
            
            const data = await response.json();
            if (data.ad) {
                displayAd(data.ad, data.requestId);
            }
        }
        
        // Track impression
        function trackImpression(requestId, adId) {
            fetch('/api/publisher/tracking/impression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: requestId,
                    siteId: 'site_123',
                    adUnitId: 'unit_456',
                    adId: adId,
                    viewability: calculateViewability(),
                    viewTime: getViewTime()
                })
            });
        }
        
        // Initialize ad units
        document.addEventListener('DOMContentLoaded', () => {
            requestAd('unit_456');
        });
    </script>
</body>
</html>
```

### 2. Server-Side Tracking

```typescript
// Server-side tracking implementation
import { DataTrackingService } from './services/data-tracking.service';

export class TrackingController {
  async trackImpression(req: Request, res: Response) {
    try {
      const trackingData = {
        requestId: req.body.requestId,
        siteId: req.body.siteId,
        adUnitId: req.body.adUnitId,
        adId: req.body.adId,
        userId: req.body.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };
      
      await DataTrackingService.trackImpression(trackingData);
      
      res.json({ success: true });
    } catch (error) {
      // Error is automatically logged by the system
      res.status(500).json({ error: 'Tracking failed' });
    }
  }
}
```

## Best Practices

### 1. Data Collection
- **Minimize Data**: Only collect necessary data
- **Anonymize**: Remove PII when possible
- **Validate**: Validate all input data
- **Secure**: Use HTTPS for all data transmission

### 2. Logging
- **Structured**: Use structured logging for machine readability
- **Contextual**: Include relevant context in log entries
- **Performance**: Avoid logging in hot paths
- **Retention**: Set appropriate log retention policies

### 3. Monitoring
- **Real-time**: Monitor system health in real-time
- **Alerts**: Set up appropriate alerting thresholds
- **Dashboards**: Create monitoring dashboards
- **Trends**: Track performance trends over time

### 4. Security
- **Access Control**: Restrict access to logs and tracking data
- **Encryption**: Encrypt sensitive data in transit and at rest
- **Audit**: Regularly audit access to tracking systems
- **Compliance**: Ensure compliance with data protection regulations

## Troubleshooting

### 1. Common Issues
- **Missing Data**: Check if tracking endpoints are being called
- **High Latency**: Monitor database performance and query optimization
- **Log Volume**: Adjust log levels and retention policies
- **Storage**: Monitor disk space for log files

### 2. Debugging
- **Enable Debug Logging**: Set LOG_LEVEL=debug in development
- **Check Log Files**: Review specific log files for errors
- **Monitor Metrics**: Use performance metrics to identify bottlenecks
- **Test Endpoints**: Verify tracking endpoints are working correctly

This comprehensive system ensures that publisher sites can effectively share data while maintaining detailed audit trails and performance monitoring for the entire platform. 