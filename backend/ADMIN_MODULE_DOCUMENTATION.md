# Precision Ads Admin Module Documentation

## Overview

The Admin Module provides comprehensive organization and user management capabilities for Precision Ads platform administrators. It implements Role-Based Access Control (RBAC) with organization context and includes the canonical specification for data ingestion.

## Features

### 🔐 **Enhanced RBAC & Authentication**
- **Organization Context**: All operations are scoped to specific organizations
- **Permission-Based Access**: Fine-grained permissions for different operations
- **Role Hierarchy**: SUPER_ADMIN → ADMIN → MANAGER → VIEWER
- **API Key Management**: Organization-scoped API keys with specific scopes

### 🏢 **Organization Management**
- Create, read, update, and delete organizations
- Organization type support (PUBLISHER, ADVERTISER, AGENCY, NETWORK, ADMIN)
- Organization statistics and performance metrics
- Bulk operations for organization management

### 👥 **User Management**
- Comprehensive user CRUD operations
- Role assignment and permission management
- Password reset and account status management
- Bulk user operations
- User session tracking

### 🔑 **API Key Management**
- Generate organization-scoped API keys
- Permission scopes for different operations
- Key expiration and revocation
- Usage tracking and monitoring

### 📊 **Canonical Specification v1**
- **Identity Management**: Track users across systems
- **Traits**: Store user properties and characteristics
- **Cohorts**: Define user segments and groups
- **Events**: Track user interactions and behaviors
- **Idempotency**: Prevent duplicate data with idempotency keys
- **Versioning**: Support for data versioning

## Architecture

### Database Schema

```sql
-- Enhanced User Management
users (id, email, password, firstName, lastName, role, status, organizationId, ...)
user_permissions (userId, permissionId, grantedAt, grantedBy, expiresAt, isActive)
permissions (id, organizationId, name, description, scope, isActive)

-- API Key Management
api_keys (id, name, keyHash, organizationId, userId, scopes, status, expiresAt, ...)

-- Canonical Spec Models
identities (id, organizationId, externalId, anonymousId, userId, traits, version, idempotencyKey, ...)
traits (id, organizationId, identityId, key, value, type, version, idempotencyKey, ...)
cohorts (id, organizationId, name, description, type, criteria, members, version, idempotencyKey, ...)
events (id, organizationId, identityId, type, name, properties, timestamp, version, idempotencyKey, ...)
```

### Permission Scopes

```typescript
enum PermissionScope {
  // Organization management
  ORG_READ, ORG_WRITE, ORG_DELETE
  
  // User management
  USERS_READ, USERS_WRITE, USERS_DELETE
  
  // Data ingestion
  INGEST_READ, INGEST_WRITE
  
  // Traits management
  TRAITS_READ, TRAITS_WRITE
  
  // Cohorts management
  COHORTS_READ, COHORTS_WRITE
  
  // Analytics and reporting
  ANALYTICS_READ, ANALYTICS_WRITE
  
  // Ad management
  ADS_READ, ADS_WRITE, ADS_DELETE
  
  // Campaign management
  CAMPAIGNS_READ, CAMPAIGNS_WRITE, CAMPAIGNS_DELETE
  
  // Publisher management
  PUBLISHER_READ, PUBLISHER_WRITE
  
  // Financial data
  FINANCIAL_READ, FINANCIAL_WRITE
}
```

## API Endpoints

### Organization Management

#### `GET /api/v1/admin/organizations`
- **Description**: Get all organizations with optional filtering
- **Permissions**: SUPER_ADMIN, ADMIN
- **Query Parameters**: `orgType`, `status`, `domain`
- **Response**: List of organizations with user counts and metrics

#### `POST /api/v1/admin/organizations`
- **Description**: Create new organization
- **Permissions**: SUPER_ADMIN
- **Body**: `{ name, orgType, domain?, settings? }`
- **Response**: Created organization with users

#### `PUT /api/v1/admin/organizations/:id`
- **Description**: Update organization
- **Permissions**: ORG_WRITE
- **Body**: `{ name?, orgType?, domain?, status?, settings? }`
- **Response**: Updated organization

#### `DELETE /api/v1/admin/organizations/:id`
- **Description**: Soft delete organization
- **Permissions**: ORG_DELETE
- **Response**: Deleted organization

#### `GET /api/v1/admin/organizations/:id/stats`
- **Description**: Get organization statistics
- **Permissions**: ORG_READ
- **Response**: User counts, site counts, campaign counts, API key counts

### User Management

#### `GET /api/v1/admin/users`
- **Description**: Get all users with optional filtering
- **Permissions**: SUPER_ADMIN, ADMIN
- **Query Parameters**: `role`, `status`, `organizationId`, `email`
- **Response**: List of users with organization details

#### `POST /api/v1/admin/users`
- **Description**: Create new user
- **Permissions**: SUPER_ADMIN, ADMIN
- **Body**: `{ email, password, firstName, lastName, role, organizationId?, permissions? }`
- **Response**: Created user

#### `PUT /api/v1/admin/users/:id`
- **Description**: Update user
- **Permissions**: USERS_WRITE
- **Body**: `{ firstName?, lastName?, role?, status?, organizationId?, permissions? }`
- **Response**: Updated user

#### `DELETE /api/v1/admin/users/:id`
- **Description**: Soft delete user
- **Permissions**: USERS_DELETE
- **Response**: Deleted user

#### `POST /api/v1/admin/users/:id/reset-password`
- **Description**: Reset user password
- **Permissions**: SUPER_ADMIN, ADMIN
- **Body**: `{ newPassword }`
- **Response**: Updated user

### API Key Management

#### `GET /api/v1/admin/api-keys`
- **Description**: Get all API keys for organization
- **Permissions**: USERS_READ
- **Response**: List of API keys with user details

#### `POST /api/v1/admin/api-keys`
- **Description**: Create new API key
- **Permissions**: USERS_WRITE
- **Body**: `{ name, userId, scopes, expiresAt? }`
- **Response**: Created API key (key shown only once)

#### `PUT /api/v1/admin/api-keys/:id`
- **Description**: Update API key
- **Permissions**: USERS_WRITE
- **Body**: `{ name?, scopes?, status?, expiresAt? }`
- **Response**: Updated API key

#### `DELETE /api/v1/admin/api-keys/:id`
- **Description**: Revoke API key
- **Permissions**: USERS_DELETE
- **Response**: Revoked API key

### Canonical Specification

#### `POST /api/v1/admin/identities`
- **Description**: Create or update identity
- **Authentication**: API Key
- **Headers**: `x-organization-id`
- **Body**: `{ externalId, anonymousId?, userId?, traits?, version?, idempotencyKey? }`
- **Response**: Created identity

#### `POST /api/v1/admin/traits`
- **Description**: Create or update trait
- **Authentication**: API Key
- **Headers**: `x-organization-id`
- **Body**: `{ identityId, key, value, type?, version?, idempotencyKey? }`
- **Response**: Created trait

#### `POST /api/v1/admin/cohorts`
- **Description**: Create cohort
- **Authentication**: API Key
- **Headers**: `x-organization-id`
- **Body**: `{ name, description?, type?, criteria, members?, version?, idempotencyKey? }`
- **Response**: Created cohort

#### `POST /api/v1/admin/events`
- **Description**: Track event
- **Authentication**: API Key
- **Headers**: `x-organization-id`
- **Body**: `{ identityId, type, name, properties?, timestamp?, version?, idempotencyKey? }`
- **Response**: Created event

#### `POST /api/v1/admin/batch`
- **Description**: Batch operations
- **Authentication**: API Key
- **Headers**: `x-organization-id`
- **Body**: `{ operations: [{ id, type, data }] }`
- **Response**: Batch operation results

## Middleware

### RBAC Middleware

#### `withOrganization`
- Extracts and validates organization context from headers
- Ensures user has access to the specified organization
- Sets `req.organizationId` for downstream middleware

#### `requirePermission(permissions: PermissionScope[])`
- Checks if user has required permissions
- Super admins bypass permission checks
- Validates permissions against user's granted permissions

#### `requireRole(roles: string[])`
- Checks if user has required role
- Simple role-based access control

#### `canAccessResource(resourceType: string, resourceIdField?: string)`
- Ensures user can access specific resource
- Validates resource ownership within organization

#### `validateAPIKey`
- Validates API key from `x-api-key` header
- Sets organization context and user context
- Updates last used timestamp

## Frontend Components

### Organization Selector
- **Component**: `OrganizationSelector.tsx`
- **Features**: 
  - Loads user's organizations
  - Persists selection in localStorage (`x-org-id`)
  - Displays organization status and type
  - Triggers callback on organization change

### Integrations Page
- **Component**: `Integrations.tsx`
- **Features**:
  - Getting started guide
  - API documentation links
  - Sample curl commands
  - Tabbed interface for different concepts
  - Organization context integration

## Security Features

### Data Isolation
- **Organization Scoping**: All data is scoped to organization ID
- **Composite Uniques**: Database constraints prevent cross-organization conflicts
- **Permission Validation**: Every operation validates user permissions

### API Key Security
- **Hashing**: API keys are hashed at rest using bcrypt
- **Scopes**: Limited permission scopes for each key
- **Expiration**: Configurable expiration dates
- **Revocation**: Immediate key revocation capability

### Audit Logging
- **CRUD Operations**: All admin operations are logged
- **Performance Metrics**: Operation timing and resource usage
- **Security Events**: Authentication and authorization events
- **Compliance**: Full audit trail for regulatory requirements

## Usage Examples

### Creating an Organization
```bash
curl -X POST http://localhost:3001/api/v1/admin/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "orgType": "ADVERTISER",
    "domain": "acme.com",
    "settings": {
      "timezone": "America/New_York",
      "currency": "USD"
    }
  }'
```

### Creating an API Key
```bash
curl -X POST http://localhost:3001/api/v1/admin/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: ORG_ID" \
  -d '{
    "name": "Data Ingestion Key",
    "userId": "USER_ID",
    "scopes": ["INGEST_WRITE", "TRAITS_WRITE", "COHORTS_WRITE"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### Tracking an Identity
```bash
curl -X POST http://localhost:3001/api/v1/admin/identities \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-organization-id: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "user_123",
    "traits": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "idempotencyKey": "unique_key_123"
  }'
```

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/precisionads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Logging Configuration
```typescript
// Log levels and rotation
const logConfig = {
  main: { level: 'info', retention: '30d' },
  audit: { level: 'info', retention: '30d' },
  performance: { level: 'info', retention: '14d' },
  database: { level: 'info', retention: '7d' },
  requests: { level: 'info', retention: '7d' }
};
```

## Best Practices

### Organization Management
1. **Naming Convention**: Use descriptive organization names
2. **Type Assignment**: Choose appropriate organization type
3. **Status Management**: Use soft deletes for data preservation
4. **Bulk Operations**: Use bulk endpoints for multiple updates

### User Management
1. **Role Assignment**: Assign minimal required roles
2. **Permission Granularity**: Use specific permissions over broad roles
3. **Password Policies**: Enforce strong password requirements
4. **Account Lifecycle**: Regular review of user accounts

### API Key Management
1. **Scope Limitation**: Grant minimal required scopes
2. **Expiration**: Set reasonable expiration dates
3. **Monitoring**: Track key usage and revoke unused keys
4. **Security**: Never log or expose API keys

### Data Ingestion
1. **Idempotency**: Always use idempotency keys
2. **Batch Processing**: Use batch endpoints for multiple operations
3. **Error Handling**: Implement proper error handling and retries
4. **Rate Limiting**: Respect API rate limits

## Troubleshooting

### Common Issues

#### Permission Denied
- Check user role and permissions
- Verify organization context
- Ensure API key has required scopes

#### Organization Not Found
- Verify organization ID in header
- Check organization status (must be ACTIVE)
- Ensure user has access to organization

#### API Key Invalid
- Verify API key is correct
- Check key expiration date
- Ensure key status is ACTIVE
- Verify organization context

#### Database Constraints
- Check for duplicate unique constraints
- Verify organization scoping
- Ensure proper foreign key relationships

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=admin:*
```

## Performance Considerations

### Database Optimization
- **Indexes**: Composite indexes on organization + resource fields
- **Partitioning**: Consider partitioning by organization for large datasets
- **Connection Pooling**: Use connection pooling for database connections

### Caching Strategy
- **Permission Cache**: Cache user permissions for performance
- **Organization Cache**: Cache organization metadata
- **API Key Cache**: Cache API key validation results

### Rate Limiting
- **Per-Organization**: Implement per-organization rate limits
- **Per-User**: Consider per-user rate limits for heavy users
- **Bulk Operations**: Higher limits for batch operations

## Future Enhancements

### Planned Features
- **Multi-Tenant Support**: Enhanced isolation and customization
- **Advanced Analytics**: Organization performance dashboards
- **Workflow Automation**: Approval workflows for sensitive operations
- **Integration APIs**: Webhook support and third-party integrations

### Scalability Improvements
- **Microservices**: Split into separate services
- **Event Sourcing**: Implement event sourcing for audit trails
- **CQRS**: Command Query Responsibility Segregation
- **Distributed Caching**: Redis-based caching layer

## Support

For technical support and questions:
- **Documentation**: [Internal Wiki]
- **API Reference**: [OpenAPI Specification]
- **Support Team**: admin-support@precisionads.com
- **Issue Tracking**: [Internal JIRA]

---

*This documentation is maintained by the Precision Ads Engineering Team* 