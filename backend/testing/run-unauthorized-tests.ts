import { APITester } from './api-tester';

async function main() {
  console.log('🚀 Running Unauthorized Tests Only');
  console.log('='.repeat(60));
  
  const tester = new APITester('http://localhost:7401');
  
  // Test 1: Get All Organizations (Unauthorized)
  const test1 = {
    name: 'Get All Organizations (Unauthorized)',
    method: 'GET' as const,
    endpoint: '/api/v1/admin/organizations',
    expectedStatus: 401
  };
  
  // Test 2: Create Identity (Unauthorized)
  const test2 = {
    name: 'Create Identity (Unauthorized)',
    method: 'POST' as const,
    endpoint: '/api/v1/admin/identities',
    body: {
      externalId: 'test_user_001',
      traits: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    },
    expectedStatus: 401
  };
  
  const tests = [test1, test2];
  
  console.log(`📊 Running ${tests.length} unauthorized tests...\n`);
  
  for (const test of tests) {
    console.log(`🧪 Running: ${test.name}`);
    console.log(`   Method: ${test.method}`);
    console.log(`   Endpoint: ${test.endpoint}`);
    console.log(`   Expected Status: ${test.expectedStatus}`);
    
    const result = await tester.runTest(test);
    
    console.log(`   Result: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Actual Status: ${result.statusCode}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.data) {
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  const results = tester.getTestResults();
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  // Export results
  const filename = `unauthorized-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  tester.exportResults(filename);
  console.log(`💾 Results exported to: ${filename}`);
}

main().catch(console.error); 