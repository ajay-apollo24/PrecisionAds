#!/usr/bin/env tsx

import APITester from './api-tester';
import { adminTestSuite, canonicalTestSuite } from './test-suites';
import { TestDataGenerator, TestData } from './test-data-generator';
import axios from 'axios';

async function getAuthToken(testData: TestData): Promise<string | null> {
  try {
    const response = await axios.post('http://localhost:7401/api/v1/auth/login', {
      email: testData.user.email,
      password: 'testpass123'
    });
    
    if (response.data.token) {
      console.log('✅ Authentication successful');
      return response.data.token;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
  }
  return null;
}

async function main() {
  console.log('🚀 Precision Ads API Testing with Fresh Test Data');
  console.log('='.repeat(60));
  
  const testDataGenerator = new TestDataGenerator();
  let testData: TestData | null = null;
  
  try {
    // Generate fresh test data
    testData = await testDataGenerator.generateTestData();
    
    // Set up cleanup on exit
    testDataGenerator.cleanupOnExit();
    
    // Get authentication token using the generated test data
    console.log('🔐 Getting authentication token...');
    const authToken = await getAuthToken(testData);
    
    if (!authToken) {
      console.log('❌ Failed to get authentication token. Exiting.');
      return;
    }
    
    const tester = new APITester('http://localhost:7401');
    tester.setAuthToken(authToken);
    
    // Update test suites with the generated test data
    const updatedAdminSuite = updateTestSuiteWithTestData(adminTestSuite, testData);
    const updatedCanonicalSuite = updateTestSuiteWithTestData(canonicalTestSuite, testData);
    
    try {
      // Test Admin Module
      console.log('\n🎯 Testing Admin Module...');
      await tester.runTestSuite(updatedAdminSuite);
      
      // Test Canonical Spec
      console.log('\n🎯 Testing Canonical Specification...');
      await tester.runTestSuite(updatedCanonicalSuite);
      
      // Print summary
      console.log('\n📊 Test Results Summary:');
      const results = tester.getTestResults();
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
      
      // Export results
      const filename = `fresh-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      tester.exportResults(filename);
      console.log(`💾 Results exported to: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error during testing:', error);
    }
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    // Always cleanup test data
    if (testData) {
      console.log('\n🧹 Final cleanup...');
      await testDataGenerator.cleanup();
    }
  }
}

function updateTestSuiteWithTestData(testSuite: any, testData: TestData): any {
  // Deep clone the test suite
  const updatedSuite = JSON.parse(JSON.stringify(testSuite));
  
  // Update all tests with the generated test data
  updatedSuite.tests = updatedSuite.tests.map((test: any) => {
    const updatedTest = { ...test };
    
    // Update headers with generated API key and organization ID
    if (updatedTest.headers) {
      if (updatedTest.headers['x-api-key'] === 'DYNAMIC_API_KEY') {
        updatedTest.headers['x-api-key'] = testData.apiKey;
      }
      if (updatedTest.headers['x-organization-id'] === 'DYNAMIC_ORG_ID') {
        updatedTest.headers['x-organization-id'] = testData.organization.id;
      }
    }
    
    // Update body with generated organization ID if needed
    if (updatedTest.body && updatedTest.body.organizationId) {
      updatedTest.body.organizationId = testData.organization.id;
    }
    
    // Update body with generated identity ID if needed
    if (updatedTest.body && updatedTest.body.identityId === 'DYNAMIC_IDENTITY_ID') {
      updatedTest.body.identityId = testData.identity.id;
    }
    
    // Handle batch operations - update identityId in nested operations
    if (updatedTest.body && updatedTest.body.operations && Array.isArray(updatedTest.body.operations)) {
      updatedTest.body.operations = updatedTest.body.operations.map((op: any) => {
        if (op.data && op.data.identityId === 'DYNAMIC_IDENTITY_ID') {
          return {
            ...op,
            data: {
              ...op.data,
              identityId: testData.identity.id
            }
          };
        }
        return op;
      });
    }
    
    return updatedTest;
  });
  
  return updatedSuite;
}

main(); 