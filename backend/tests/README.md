# Testing Structure

This directory contains the comprehensive testing suite for the Precision Ads Backend.

## Test Types

### 1. Unit Tests (`tests/unit/`)
- **Location**: `tests/unit/modules/`
- **Purpose**: Test individual functions and methods in isolation
- **Coverage**: All service methods, utilities, and business logic
- **Status**: ✅ **COMPLETE** - All 157 tests passing

**Modules Tested:**
- ✅ Analytics Reporting
- ✅ Audience Management  
- ✅ Ad Serving (Frequency, Targeting, Optimization, Auction)
- ✅ Advertiser (Campaigns, Ads, Audiences, Bidding)
- ✅ Admin (Users, Organizations)
- ✅ Publisher (Sites, Ad Units)
- ✅ Shared (RBAC, Authentication)

### 2. Integration Tests (`tests/integration/`)
- **Location**: `tests/integration/`
- **Purpose**: Test interaction between services and database
- **Coverage**: Service-to-database integration, data flow
- **Status**: 🚧 **IN PROGRESS** - Structure created, tests being implemented

**Structure Created:**
- ✅ Test utilities (`test-database.ts`, `test-server.ts`, `test-data-factory.ts`)
- ✅ Analytics integration test template
- 🚧 Additional module integration tests

### 3. API Tests (`tests/api/`)
- **Location**: `tests/api/`
- **Purpose**: Test HTTP endpoints and API behavior
- **Coverage**: REST API endpoints, authentication, request/response
- **Status**: 🚧 **IN PROGRESS** - Structure created, tests being implemented

**Structure Created:**
- ✅ Test helpers (`api-client.ts`, `test-server.ts`)
- ✅ Test fixtures (`test-data.ts`)
- ✅ Authentication API test suite
- 🚧 Additional endpoint test suites

### 4. E2E Tests (`tests/e2e/`)
- **Location**: `tests/e2e/`
- **Purpose**: End-to-end user workflows
- **Status**: 📋 **PLANNED**

### 5. Performance Tests (`tests/performance/`)
- **Location**: `tests/performance/`
- **Purpose**: Load testing and performance validation
- **Status**: 📋 **PLANNED**

## Running Tests

### Unit Tests (Jest)
```bash
# Run all unit tests
npm run test:unit

# Run specific module tests
npm run test:unit -- --testPathPattern=analytics
npm run test:unit -- --testPathPattern=advertiser
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage
```

### API Tests
```bash
# Run API tests
npm run test:api

# Run with coverage
npm run test:api -- --coverage
```

### All Tests
```bash
# Run all test types
npm run test:all
```

## Test Configuration

### Jest Configs
- **`jest.config.js`** - Unit tests (default)
- **`jest.integration.config.js`** - Integration tests
- **`jest.api.config.js`** - API tests

### Environment Variables
- **`TEST_DATABASE_URL`** - Test database connection
- **`NODE_ENV=test`** - Test environment

## Test Utilities

### Integration Tests
- **`TestDatabase`** - Database setup/teardown for integration tests
- **`TestServer`** - Express server instance for testing
- **`TestDataFactory`** - Generate test data using Faker.js

### API Tests
- **`APIClient`** - HTTP client for API testing
- **`createTestServer`** - Create Express app for API testing
- **Test Fixtures** - Predefined test data

## Coverage Goals

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

## Next Steps

1. **Complete Integration Tests**
   - Implement remaining module integration tests
   - Add database transaction rollback for test isolation

2. **Complete API Tests**
   - Implement endpoint test suites for all modules
   - Add authentication and authorization tests
   - Test error handling and edge cases

3. **Add E2E Tests**
   - User registration and login flows
   - Campaign creation and management workflows
   - Ad serving and analytics workflows

4. **Add Performance Tests**
   - Load testing for high-traffic scenarios
   - Database performance under load
   - API response time benchmarks

## Test Data Management

- **Unit Tests**: Mocked data and services
- **Integration Tests**: Test database with seeded data
- **API Tests**: In-memory Express app with test data
- **E2E Tests**: Full database with realistic data scenarios

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Clean up test data after each test
3. **Mocking**: Mock external dependencies appropriately
4. **Assertions**: Use descriptive test names and clear assertions
5. **Coverage**: Aim for high test coverage across all modules 