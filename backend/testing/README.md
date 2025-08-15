# 🧪 Precision Ads API Testing Module

A comprehensive testing framework for testing all Precision Ads API endpoints against a running server.

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
npm run dev
```

### 2. Run All Tests
```bash
npm run test:api:all
```

### 3. Run Specific Test Suites
```bash
# Health & Basic endpoints
npm run test:api:health

# Admin module endpoints
npm run test:api:admin

# Canonical specification endpoints
npm run test:api:canonical

# All endpoints
npm run test:api:all
```

## 📋 Available Test Suites

| Suite | Description | Endpoints Tested |
|-------|-------------|------------------|
| **Health & Basic** | Server health and documentation | `/health`, `/api/v1/docs` |
| **Authentication** | User registration and login | `/api/v1/auth/register`, `/api/v1/auth/login` |
| **Admin Module** | Organization and user management | `/api/v1/admin/*` |
| **Canonical Spec** | Identity, Traits, Cohorts, Events | `/api/v1/admin/identities`, `/api/v1/admin/traits`, etc. |
| **Publisher** | Publisher-specific endpoints | `/api/v1/publisher/*` |
| **Ad Serving** | Ad request and tracking | `/api/v1/ad-serving/*` |
| **Analytics** | Performance analytics | `/api/v1/analytics-reporting/*` |
| **Audience** | Audience management | `/api/v1/audience-management/*` |
| **Advanced** | AI and RTB algorithms | `/api/v1/advanced-algorithms/*` |

## 🛠️ Manual Testing

### Using the Test Runner Directly
```bash
# Test against local server
npx tsx testing/run-tests.ts

# Test against specific server
npx tsx testing/run-tests.ts http://staging.example.com

# Test specific suite
npx tsx testing/run-tests.ts http://localhost:7401 3  # Admin module
```

### Using the Shell Script
```bash
# Test all suites
./scripts/test-api.sh

# Test specific suite
./scripts/test-api.sh http://localhost:7401 4  # Canonical spec
```

## 🔑 Authentication Setup

### For Admin Module Tests
1. **Login as Super Admin:**
   ```bash
   curl -X POST http://localhost:7401/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "superadmin@precisionads.com",
       "password": "superadmin123"
     }'
   ```

2. **Use the returned token:**
   ```bash
   export AUTH_TOKEN="your_jwt_token_here"
   npm run test:api:admin
   ```

### For Canonical Spec Tests
1. **Get API Key from database:**
   ```bash
   npm run db:studio
   # Navigate to APIKey table and copy a valid key
   ```

2. **Update test headers in `test-suites.ts`:**
   ```typescript
   headers: {
     'x-api-key': 'your_actual_api_key',
     'x-organization-id': 'your_org_id'
   }
   ```

## 📊 Test Results

### Console Output
Tests provide real-time feedback:
```
🧪 Running test: Get All Organizations (Authorized)
✅ Get All Organizations (Authorized) - PASSED (200) - 45ms
❌ Create Identity (API Key) - FAILED (401) - 23ms
```

### JSON Export
Results are automatically exported to timestamped files:
```
📊 Results exported to: api-test-results-2024-01-15T10-30-45-123Z.json
```

### Result Structure
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "baseURL": "http://localhost:7401",
  "results": [
    {
      "name": "Test Name",
      "success": true,
      "statusCode": 200,
      "responseTime": 45,
      "data": { ... }
    }
  ],
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "successRate": 92.0
  }
}
```

## 🔧 Customizing Tests

### Adding New Test Cases
```typescript
// In test-suites.ts
export const customTestSuite: TestSuite = {
  name: 'Custom Endpoints',
  tests: [
    {
      name: 'Custom Test',
      method: 'POST',
      endpoint: '/api/v1/custom/endpoint',
      body: { key: 'value' },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success === true
    }
  ]
};
```

### Custom Response Validation
```typescript
{
  name: 'Validate Complex Response',
  method: 'GET',
  endpoint: '/api/v1/complex/data',
  expectedStatus: 200,
  validateResponse: (data: any) => {
    return data.success && 
           data.data.length > 0 && 
           data.data[0].hasOwnProperty('requiredField');
  }
}
```

### Testing with Different Headers
```typescript
{
  name: 'Test with Custom Headers',
  method: 'POST',
  endpoint: '/api/v1/secure/endpoint',
  headers: {
    'x-custom-header': 'custom-value',
    'x-version': '2.0'
  },
  body: { data: 'test' },
  expectedStatus: 200
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   ❌ Server is not accessible. Please ensure the backend is running.
   Run: npm run dev
   ```

2. **Authentication Errors**
   - Ensure valid JWT token for admin endpoints
   - Check API key validity for canonical spec endpoints
   - Verify organization ID exists

3. **Test Failures**
   - Check server logs for detailed error messages
   - Verify database has seed data: `npm run db:seed`
   - Ensure all required environment variables are set

4. **Timeout Errors**
   - Increase timeout in `api-tester.ts` (default: 10 seconds)
   - Check server performance and database queries

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
export DEBUG=true
npm run test:api:all
```

## 📈 Performance Testing

### Response Time Monitoring
All tests measure and report response times:
```
✅ Test Name - PASSED (200) - 45ms
```

### Load Testing
For performance testing, create multiple concurrent test runs:
```typescript
// Example: Run same test multiple times
const loadTest = async () => {
  const promises = Array(10).fill(null).map(() => 
    tester.runTest(testCase)
  );
  const results = await Promise.all(promises);
  // Analyze response times and success rates
};
```

## 🔒 Security Testing

### Unauthorized Access Tests
Test suites include unauthorized access scenarios:
```typescript
{
  name: 'Get All Organizations (Unauthorized)',
  method: 'GET',
  endpoint: '/api/v1/admin/organizations',
  expectedStatus: 401  // Should fail without auth
}
```

### API Key Validation
Test API key scopes and expiration:
```typescript
{
  name: 'Test Expired API Key',
  method: 'POST',
  endpoint: '/api/v1/admin/identities',
  headers: {
    'x-api-key': 'expired_key',
    'x-organization-id': 'org_id'
  },
  expectedStatus: 401
}
```

## 📝 Contributing

### Adding New Test Suites
1. Create test cases in `test-suites.ts`
2. Add suite to `allTestSuites` array
3. Update this README with new suite information
4. Add npm scripts for easy execution

### Test Best Practices
- **Isolation**: Each test should be independent
- **Validation**: Always validate response structure and content
- **Error Handling**: Test both success and failure scenarios
- **Performance**: Monitor response times for regression detection
- **Documentation**: Clear test names and descriptions

## 🎯 Next Steps

1. **Integration Tests**: Add database transaction rollback for test isolation
2. **Mock Services**: Create mock external services for comprehensive testing
3. **Performance Benchmarks**: Establish baseline performance metrics
4. **CI/CD Integration**: Automate testing in deployment pipelines
5. **Test Coverage**: Expand test coverage to edge cases and error scenarios

---

**Happy Testing! 🧪✨** 