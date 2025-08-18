#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner
 * Integrates Jest unit tests with main API testing framework
 */

import { execSync } from 'child_process';
import { APITester } from './api-tester';
import { 
  allTestSuites, 
  analyticsTestSuite, 
  audienceTestSuite,
  adServingTestSuite,
  advertiserTestSuite,
  advancedAlgorithmsTestSuite
} from './test-suites';
import { logger } from '../src/shared/middleware/logger';

interface TestSummary {
  unitTests: {
    total: number;
    passed: number;
    failed: number;
    coverage?: number;
  };
  apiTests: {
    total: number;
    passed: number;
    failed: number;
  };
  totalTime: number;
}

class ComprehensiveTestRunner {
  private baseURL: string;
  private apiTester: APITester;
  private startTime: number;

  constructor(baseURL: string = 'http://localhost:7401') {
    this.baseURL = baseURL;
    this.apiTester = new APITester(baseURL);
    this.startTime = Date.now();
  }

  /**
   * Run Jest unit tests
   */
  private async runUnitTests(): Promise<{ passed: number; failed: number; total: number }> {
    console.log('\n🧪 Running Jest Unit Tests...');
    console.log('=====================================');

    try {
      // Run Jest tests with coverage
      const jestOutput = execSync('npm test -- --coverage --silent', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      // Parse Jest output to get test counts
      const lines = jestOutput.split('\n');
      let total = 0;
      let passed = 0;
      let failed = 0;

      for (const line of lines) {
        if (line.includes('Tests:')) {
          const match = line.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
          if (match) {
            failed = parseInt(match[1]);
            passed = parseInt(match[2]);
            total = parseInt(match[3]);
          }
        }
      }

      console.log(`✅ Unit Tests: ${passed} passed, ${failed} failed, ${total} total`);
      return { passed, failed, total };

    } catch (error: any) {
      console.error('❌ Error running Jest tests:', error.message);
      return { passed: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Run specific API test suite
   */
  private async runAPITestSuite(suiteName: string, testSuite: any): Promise<{ passed: number; failed: number; total: number }> {
    console.log(`\n🌐 Running ${suiteName} API Tests...`);
    console.log('=====================================');

    try {
      const results = await this.apiTester.runTestSuite(testSuite);
      
      const passed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const total = results.length;

      console.log(`✅ ${suiteName}: ${passed} passed, ${failed} failed, ${total} total`);

      // Log failed tests
      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(result => {
          console.log(`   • ${result.name}: ${result.error}`);
        });
      }

      return { passed, failed, total };

    } catch (error: any) {
      console.error(`❌ Error running ${suiteName} tests:`, error.message);
      return { passed: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================');
    console.log(`📍 Testing against: ${this.baseURL}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);

    // Run unit tests
    const unitTestResults = await this.runUnitTests();

    // Run API tests
    console.log('\n🌐 Running API Integration Tests...');
    console.log('=====================================');

    const analyticsResults = await this.runAPITestSuite('Analytics', analyticsTestSuite);
    const audienceResults = await this.runAPITestSuite('Audience Management', audienceTestSuite);
    const adServingResults = await this.runAPITestSuite('Ad Serving', adServingTestSuite);
    const advertiserResults = await this.runAPITestSuite('Advertiser', advertiserTestSuite);
    const advancedAlgorithmsResults = await this.runAPITestSuite('Advanced Algorithms', advancedAlgorithmsTestSuite);

    // Calculate totals
    const apiTotal = analyticsResults.total + audienceResults.total + adServingResults.total + advertiserResults.total + advancedAlgorithmsResults.total;
    const apiPassed = analyticsResults.passed + audienceResults.passed + adServingResults.passed + advertiserResults.passed + advancedAlgorithmsResults.passed;
    const apiFailed = analyticsResults.failed + audienceResults.failed + adServingResults.failed + advertiserResults.failed + advancedAlgorithmsResults.failed;

    const totalTime = Date.now() - this.startTime;

    // Generate summary
    const summary: TestSummary = {
      unitTests: unitTestResults,
      apiTests: {
        total: apiTotal,
        passed: apiPassed,
        failed: apiFailed
      },
      totalTime
    };

    // Print final summary
    this.printSummary(summary);

    return summary;
  }

  /**
   * Print test summary
   */
  private printSummary(summary: TestSummary): void {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=====================================');
    
    console.log('\n🧪 Unit Tests:');
    console.log(`   Total: ${summary.unitTests.total}`);
    console.log(`   Passed: ${summary.unitTests.passed}`);
    console.log(`   Failed: ${summary.unitTests.failed}`);
    console.log(`   Success Rate: ${summary.unitTests.total > 0 ? ((summary.unitTests.passed / summary.unitTests.total) * 100).toFixed(1) : 0}%`);

    console.log('\n🌐 API Integration Tests:');
    console.log(`   Total: ${summary.apiTests.total}`);
    console.log(`   Passed: ${summary.apiTests.passed}`);
    console.log(`   Failed: ${summary.apiTests.failed}`);
    console.log(`   Success Rate: ${summary.apiTests.total > 0 ? ((summary.apiTests.passed / summary.apiTests.total) * 100).toFixed(1) : 0}%`);

    const totalTests = summary.unitTests.total + summary.apiTests.total;
    const totalPassed = summary.unitTests.passed + summary.apiTests.passed;
    const totalFailed = summary.unitTests.failed + summary.apiTests.failed;

    console.log('\n🎯 Overall Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Total Passed: ${totalPassed}`);
    console.log(`   Total Failed: ${totalFailed}`);
    console.log(`   Overall Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`   Total Time: ${(summary.totalTime / 1000).toFixed(2)}s`);

    // Export results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comprehensive-test-results-${timestamp}.json`;
    
    try {
      this.apiTester.exportResults(filename);
      console.log(`\n📁 Results exported to: ${filename}`);
    } catch (error) {
      console.error('\n❌ Failed to export results:', error);
    }

    // Final status
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! 🎉');
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the output above.`);
    }
  }

  /**
   * Run specific test categories
   */
  async runSpecificTests(categories: string[]): Promise<TestSummary> {
    console.log('🚀 Running Specific Test Categories');
    console.log('=====================================');
    console.log(`📍 Categories: ${categories.join(', ')}`);
    console.log(`📍 Testing against: ${this.baseURL}`);

    const unitTestResults = await this.runUnitTests();
    let apiTotal = 0;
    let apiPassed = 0;
    let apiFailed = 0;

    if (categories.includes('analytics')) {
      const results = await this.runAPITestSuite('Analytics', analyticsTestSuite);
      apiTotal += results.total;
      apiPassed += results.passed;
      apiFailed += results.failed;
    }

    if (categories.includes('audience')) {
      const results = await this.runAPITestSuite('Audience Management', audienceTestSuite);
      apiTotal += results.total;
      apiPassed += results.passed;
      apiFailed += results.failed;
    }

    if (categories.includes('ad-serving')) {
      const results = await this.runAPITestSuite('Ad Serving', adServingTestSuite);
      apiTotal += results.total;
      apiPassed += results.passed;
      apiFailed += results.failed;
    }

    if (categories.includes('advertiser')) {
      const results = await this.runAPITestSuite('Advertiser', advertiserTestSuite);
      apiTotal += results.total;
      apiPassed += results.passed;
      apiFailed += results.failed;
    }

    if (categories.includes('advanced-algorithms')) {
      const results = await this.runAPITestSuite('Advanced Algorithms', advancedAlgorithmsTestSuite);
      apiTotal += results.total;
      apiPassed += results.passed;
      apiFailed += results.failed;
    }

    const totalTime = Date.now() - this.startTime;
    const summary: TestSummary = {
      unitTests: unitTestResults,
      apiTests: { total: apiTotal, passed: apiPassed, failed: apiFailed },
      totalTime
    };

    this.printSummary(summary);
    return summary;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const baseURL = args[0] || 'http://localhost:7401';
  
  const runner = new ComprehensiveTestRunner(baseURL);

  try {
    if (args.length > 1) {
      // Run specific categories
      const categories = args.slice(1);
      await runner.runSpecificTests(categories);
    } else {
      // Run all tests
      await runner.runAllTests();
    }
  } catch (error) {
    console.error('❌ Error during comprehensive testing:', error);
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

export default ComprehensiveTestRunner; 