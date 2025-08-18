#!/usr/bin/env tsx

import APITester from './api-tester';
import allTestSuites, { 
  healthTestSuite, 
  authTestSuite, 
  adminTestSuite, 
  canonicalTestSuite,
  publisherTestSuite,
  adServingTestSuite,
  analyticsTestSuite,
  audienceTestSuite,
  advertiserTestSuite,
  advancedAlgorithmsTestSuite
} from './test-suites';
import { logger } from '../src/shared/middleware/logger';

async function main() {
  const args = process.argv.slice(2);
  const baseURL = args[0] || 'http://localhost:7401';
  
  console.log('🚀 Precision Ads API Testing Suite');
  console.log(`🌐 Base URL: ${baseURL}`);
  console.log('='.repeat(60));
  
  const tester = new APITester(baseURL);
  
  try {
    // Check if server is running
    console.log('🔍 Checking server availability...');
    try {
      const response = await fetch(`${baseURL}/health`);
      if (response.ok) {
        console.log('✅ Server is running and responding');
      } else {
        console.log('⚠️  Server responded but with non-OK status');
      }
    } catch (error) {
      console.log('❌ Server is not accessible. Please ensure the backend is running.');
      console.log('   Run: npm run dev');
      process.exit(1);
    }
    
    console.log('\n📋 Available test suites:');
    console.log('   1. Health & Basic Endpoints');
    console.log('   2. Authentication Endpoints');
    console.log('   3. Admin Module Endpoints');
    console.log('   4. Canonical Specification Endpoints');
    console.log('   5. Publisher Module Endpoints');
    console.log('   6. Ad Serving Endpoints');
    console.log('   7. Analytics & Reporting Endpoints');
    console.log('   8. Audience Management Endpoints');
    console.log('   9. Advertiser Module Endpoints');
    console.log('   10. Advanced Algorithms Endpoints');
    console.log('   0. All Test Suites');
    
    // If specific suite is requested
    if (args[1]) {
      const suiteNumber = parseInt(args[1]);
      let selectedSuite: any;
      
      switch (suiteNumber) {
        case 1:
          selectedSuite = healthTestSuite;
          break;
        case 2:
          selectedSuite = authTestSuite;
          break;
        case 3:
          selectedSuite = adminTestSuite;
          break;
        case 4:
          selectedSuite = canonicalTestSuite;
          break;
        case 5:
          selectedSuite = publisherTestSuite;
          break;
        case 6:
          selectedSuite = adServingTestSuite;
          break;
        case 7:
          selectedSuite = analyticsTestSuite;
          break;
        case 8:
          selectedSuite = audienceTestSuite;
          break;
        case 9:
          selectedSuite = advertiserTestSuite;
          break;
        case 10:
          selectedSuite = advancedAlgorithmsTestSuite;
          break;
        case 0:
          selectedSuite = allTestSuites;
          break;
        default:
          console.log('❌ Invalid suite number. Please choose 1-10 or 0 for all.');
          process.exit(1);
      }
      
      if (suiteNumber === 0) {
        console.log('\n🎯 Running all test suites...');
        await tester.runTestSuites(selectedSuite);
      } else {
        console.log(`\n🎯 Running test suite: ${selectedSuite.name}`);
        await tester.runTestSuite(selectedSuite);
      }
    } else {
      // Interactive mode
      console.log('\n🎯 Running all test suites...');
      await tester.runTestSuites(allTestSuites);
    }
    
    // Export results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `api-test-results-${timestamp}.json`;
    tester.exportResults(filename);
    
    console.log('\n🎉 Testing completed!');
    console.log(`📊 Results exported to: ${filename}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Testing interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Testing terminated');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export default main; 