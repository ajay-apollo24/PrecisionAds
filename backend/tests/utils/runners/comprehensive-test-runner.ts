/**
 * Comprehensive Test Runner
 * 
 * This runner orchestrates all types of tests:
 * - Jest unit tests
 * - API integration tests
 * - Performance tests
 * - E2E tests
 */

import { execSync } from 'child_process';
import { logger } from '../../../src/shared/middleware/logger';

export interface TestResult {
  category: string;
  module?: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
  errors?: string[];
}

export interface TestSummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  overallCoverage: number;
  categories: TestResult[];
  modules: Record<string, TestResult>;
}

export interface TestOptions {
  categories?: string[];
  modules?: string[];
  parallel?: boolean;
  coverage?: boolean;
  verbose?: boolean;
  output?: 'console' | 'json' | 'html';
}

export class ComprehensiveTestRunner {
  private options: TestOptions;
  private results: TestResult[] = [];
  private startTime: number;

  constructor(options: TestOptions = {}) {
    this.options = {
      parallel: true,
      coverage: true,
      verbose: false,
      output: 'console',
      ...options
    };
    this.startTime = Date.now();
  }

  /**
   * Run all tests based on options
   */
  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================');
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`🔧 Options: ${JSON.stringify(this.options, null, 2)}`);

    try {
      // Run Jest unit tests
      if (!this.options.categories || this.options.categories.includes('unit')) {
        await this.runJestTests();
      }

      // Run API integration tests
      if (!this.options.categories || this.options.categories.includes('api')) {
        await this.runAPITests();
      }

      // Run performance tests
      if (!this.options.categories || this.options.categories.includes('performance')) {
        await this.runPerformanceTests();
      }

      // Run E2E tests
      if (!this.options.categories || this.options.categories.includes('e2e')) {
        await this.runE2ETests();
      }

      return this.generateSummary();

    } catch (error) {
      console.error('❌ Error during test execution:', error);
      throw error;
    }
  }

  /**
   * Run Jest unit tests
   */
  private async runJestTests(): Promise<void> {
    console.log('\n🧪 Running Jest Unit Tests...');
    console.log('=====================================');

    try {
      const jestOptions = [
        '--coverage',
        '--silent',
        '--passWithNoTests'
      ];

      if (this.options.verbose) {
        jestOptions.push('--verbose');
      }

      const command = `npm test -- ${jestOptions.join(' ')}`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      // Parse Jest output
      const result = this.parseJestOutput(output);
      this.results.push(result);

      console.log(`✅ Jest Tests: ${result.passed} passed, ${result.failed} failed, ${result.total} total`);

    } catch (error: any) {
      console.error('❌ Error running Jest tests:', error.message);
      this.results.push({
        category: 'unit',
        total: 0,
        passed: 0,
        failed: 1,
        duration: 0,
        errors: [error.message]
      });
    }
  }

  /**
   * Run API integration tests
   */
  private async runAPITests(): Promise<void> {
    console.log('\n🌐 Running API Integration Tests...');
    console.log('=====================================');

    try {
      // Import and run the existing API test runner
      const { runComprehensiveTests } = await import('../../../testing/run-comprehensive-tests');
      const runner = new (await import('../../../testing/run-comprehensive-tests')).default('http://localhost:7401');
      
      const result = await runner.runAllTests();
      
      this.results.push({
        category: 'api',
        total: result.unitTests.total + result.apiTests.total,
        passed: result.unitTests.passed + result.apiTests.passed,
        failed: result.unitTests.failed + result.apiTests.failed,
        duration: result.totalTime / 1000
      });

    } catch (error: any) {
      console.error('❌ Error running API tests:', error.message);
      this.results.push({
        category: 'api',
        total: 0,
        passed: 0,
        failed: 1,
        duration: 0,
        errors: [error.message]
      });
    }
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('\n⚡ Running Performance Tests...');
    console.log('=====================================');

    // Placeholder for performance tests
    this.results.push({
      category: 'performance',
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0
    });

    console.log('✅ Performance Tests: Not implemented yet');
  }

  /**
   * Run E2E tests
   */
  private async runE2ETests(): Promise<void> {
    console.log('\n🔗 Running End-to-End Tests...');
    console.log('=====================================');

    // Placeholder for E2E tests
    this.results.push({
      category: 'e2e',
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0
    });

    console.log('✅ E2E Tests: Not implemented yet');
  }

  /**
   * Parse Jest output to extract test results
   */
  private parseJestOutput(output: string): TestResult {
    const lines = output.split('\n');
    let total = 0;
    let passed = 0;
    let failed = 0;
    let coverage = 0;

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (match) {
          failed = parseInt(match[1]);
          passed = parseInt(match[2]);
          total = parseInt(match[3]);
        }
      }

      if (line.includes('All files')) {
        const match = line.match(/(\d+)%/);
        if (match) {
          coverage = parseInt(match[1]);
        }
      }
    }

    return {
      category: 'unit',
      total,
      passed,
      failed,
      duration: 0,
      coverage
    };
  }

  /**
   * Generate comprehensive test summary
   */
  private generateSummary(): TestSummary {
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = Date.now() - this.startTime;
    const overallCoverage = this.results.reduce((sum, r) => sum + (r.coverage || 0), 0) / this.results.length;

    const modules: Record<string, TestResult> = {};
    this.results.forEach(result => {
      if (result.module) {
        modules[result.module] = result;
      }
    });

    const summary: TestSummary = {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration: totalDuration / 1000,
      overallCoverage: Math.round(overallCoverage),
      categories: this.results,
      modules
    };

    this.printSummary(summary);
    return summary;
  }

  /**
   * Print test summary
   */
  private printSummary(summary: TestSummary): void {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=====================================');
    
    console.log('\n🎯 Overall Results:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Total Passed: ${summary.totalPassed}`);
    console.log(`   Total Failed: ${summary.totalFailed}`);
    console.log(`   Overall Success Rate: ${summary.totalTests > 0 ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`   Overall Coverage: ${summary.overallCoverage}%`);
    console.log(`   Total Time: ${summary.totalDuration.toFixed(2)}s`);

    console.log('\n📋 Results by Category:');
    summary.categories.forEach(result => {
      const successRate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0;
      console.log(`   ${result.category.toUpperCase()}: ${result.passed}/${result.total} (${successRate}%)`);
    });

    // Final status
    if (summary.totalFailed === 0) {
      console.log('\n🎉 All tests passed! 🎉');
    } else {
      console.log(`\n⚠️  ${summary.totalFailed} test(s) failed. Please review the output above.`);
    }
  }

  /**
   * Export results to file
   */
  exportResults(filename?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `comprehensive-test-results-${timestamp}.json`;
    const outputFilename = filename || defaultFilename;

    try {
      const fs = require('fs');
      const summary = this.generateSummary();
      fs.writeFileSync(outputFilename, JSON.stringify(summary, null, 2));
      console.log(`\n📁 Results exported to: ${outputFilename}`);
    } catch (error) {
      console.error('\n❌ Failed to export results:', error);
    }
  }
}

/**
 * Main function for running comprehensive tests
 */
export async function runAllTests(options: TestOptions = {}): Promise<TestSummary> {
  const runner = new ComprehensiveTestRunner(options);
  return await runner.runAllTests();
}

export default ComprehensiveTestRunner; 