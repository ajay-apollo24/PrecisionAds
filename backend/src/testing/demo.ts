#!/usr/bin/env tsx

import APITester from './api-tester';
import { healthTestSuite, adminTestSuite } from './test-suites';

/**
 * Demo script showing how to use the API testing module programmatically
 */
async function demo() {
  console.log('🎭 Precision Ads API Testing Demo');
  console.log('==================================');
  
  // Create tester instance
  const tester = new APITester('http://localhost:3001');
  
  try {
    // Demo 1: Run a single test suite
    console.log('\n🎯 Demo 1: Running Health Test Suite');
    console.log('-'.repeat(40));
    await tester.runTestSuite(healthTestSuite);
    
    // Demo 2: Run individual tests
    console.log('\n🎯 Demo 2: Running Individual Tests');
    console.log('-'.repeat(40));
    
    const customTest = {
      name: 'Custom Health Check',
      method: 'GET' as const,
      endpoint: '/health',
      expectedStatus: 200,
      validateResponse: (data: any) => {
        console.log(`   📊 Response data: ${JSON.stringify(data, null, 2)}`);
        return data.status === 'OK';
      }
    };
    
    await tester.runTest(customTest);
    
    // Demo 3: Test with authentication
    console.log('\n🎯 Demo 3: Testing with Authentication');
    console.log('-'.repeat(40));
    
    // First, try to access admin endpoint without auth
    const unauthorizedTest = {
      name: 'Admin Access (Unauthorized)',
      method: 'GET' as const,
      endpoint: '/api/v1/admin/organizations',
      expectedStatus: 401
    };
    
    await tester.runTest(unauthorizedTest);
    
    // Demo 4: Performance testing
    console.log('\n🎯 Demo 4: Performance Testing');
    console.log('-'.repeat(40));
    
    const performanceTest = {
      name: 'Health Endpoint Performance',
      method: 'GET' as const,
      endpoint: '/health',
      expectedStatus: 200
    };
    
    // Run the same test multiple times to measure performance
    const iterations = 5;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await tester.runTest({
        ...performanceTest,
        name: `${performanceTest.name} (Run ${i + 1})`
      });
      results.push(result);
    }
    
    // Calculate performance metrics
    const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
    const minResponseTime = Math.min(...results.map(r => r.responseTime || 0));
    const maxResponseTime = Math.max(...results.map(r => r.responseTime || 0));
    
    console.log(`   📊 Performance Results (${iterations} runs):`);
    console.log(`      Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`      Min: ${minResponseTime}ms`);
    console.log(`      Max: ${maxResponseTime}ms`);
    
    // Demo 5: Export results
    console.log('\n🎯 Demo 5: Exporting Test Results');
    console.log('-'.repeat(40));
    
    const filename = 'demo-test-results.json';
    tester.exportResults(filename);
    console.log(`   💾 Results exported to: ${filename}`);
    
    // Demo 6: Custom test suite
    console.log('\n🎯 Demo 6: Custom Test Suite');
    console.log('-'.repeat(40));
    
    const customSuite = {
      name: 'Custom Demo Suite',
      tests: [
        {
          name: 'API Documentation Endpoint',
          method: 'GET' as const,
          endpoint: '/api/v1/docs',
          expectedStatus: 200,
          validateResponse: (data: any) => {
            console.log(`   📚 Docs response: ${data.message}`);
            return data.message && data.message.includes('Documentation');
          }
        },
        {
          name: 'Non-existent Endpoint (404)',
          method: 'GET' as const,
          endpoint: '/api/v1/non-existent',
          expectedStatus: 404
        }
      ]
    };
    
    await tester.runTestSuite(customSuite);
    
    // Final summary
    console.log('\n🎉 Demo Completed Successfully!');
    console.log('='.repeat(40));
    
    const allResults = tester.getTestResults();
    const total = allResults.length;
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    
    console.log(`📊 Total Tests Run: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      allResults.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demo().catch((error) => {
    console.error('❌ Unhandled error in demo:', error);
    process.exit(1);
  });
}

export default demo; 