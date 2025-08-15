import axios, { AxiosResponse } from 'axios';
import { logger } from '../src/shared/middleware/logger';

export interface TestResult {
  name: string;
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  data?: any;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  validateResponse?: (response: any) => boolean;
}

export class APITester {
  private baseURL: string;
  private authToken: string | null = null;
  private testResults: TestResult[] = [];

  constructor(baseURL: string = 'http://localhost:7401') {
    this.baseURL = baseURL;
  }

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get default headers including auth if available
   */
  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    // Only add auth token if no explicit Authorization header is provided
    // This allows tests to explicitly opt out of authentication
    const hasExplicitAuth = additionalHeaders && additionalHeaders.Authorization !== undefined;
    if (this.authToken && !hasExplicitAuth) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make an HTTP request and measure response time
   */
  private async makeRequest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${this.baseURL}${testCase.endpoint}`;
    
    try {
      const response: AxiosResponse = await axios({
        method: testCase.method,
        url,
        headers: this.getHeaders(testCase.headers),
        data: testCase.body,
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => true // Don't throw errors for any status codes
      });

      const responseTime = Date.now() - startTime;
      const success = testCase.expectedStatus ? response.status === testCase.expectedStatus : response.status < 400;

      // Validate response if custom validator provided
      let validationPassed = true;
      if (testCase.validateResponse) {
        try {
          validationPassed = testCase.validateResponse(response.data);
        } catch (error) {
          validationPassed = false;
        }
      }

      return {
        name: testCase.name,
        success: success && validationPassed,
        statusCode: response.status,
        responseTime,
        data: response.data,
        error: validationPassed ? undefined : 'Response validation failed'
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: testCase.name,
        success: false,
        statusCode: error.response?.status,
        responseTime,
        error: error.message || 'Request failed'
      };
    }
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    logger.info(`🧪 Running test: ${testCase.name}`);
    const result = await this.makeRequest(testCase);
    
    if (result.success) {
      logger.info(`✅ ${testCase.name} - PASSED (${result.statusCode}) - ${result.responseTime}ms`);
    } else {
      logger.error(`❌ ${testCase.name} - FAILED (${result.statusCode}) - ${result.error}`);
    }
    
    this.testResults.push(result);
    return result;
  }

  /**
   * Run a test suite
   */
  async runTestSuite(testSuite: TestSuite): Promise<TestResult[]> {
    logger.info(`🚀 Starting test suite: ${testSuite.name}`);
    logger.info(`📊 Total tests: ${testSuite.tests.length}`);
    
    const results: TestResult[] = [];
    
    for (const testCase of testSuite.tests) {
      const result = await this.runTest(testCase);
      results.push(result);
      
      // Small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`📊 Test suite completed: ${testSuite.name}`);
    logger.info(`✅ Passed: ${passed}, ❌ Failed: ${failed}`);
    
    return results;
  }

  /**
   * Run multiple test suites
   */
  async runTestSuites(testSuites: TestSuite[]): Promise<TestResult[]> {
    logger.info(`🎯 Starting comprehensive API testing`);
    logger.info(`📋 Total test suites: ${testSuites.length}`);
    
    const allResults: TestResult[] = [];
    
    for (const testSuite of testSuites) {
      const results = await this.runTestSuite(testSuite);
      allResults.push(...results);
      
      // Delay between test suites
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.printSummary(allResults);
    return allResults;
  }

  /**
   * Print test results summary
   */
  private printSummary(results: TestResult[]): void {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / total;

    console.log('\n' + '='.repeat(60));
    console.log('📊 API TESTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.name}: ${result.error} (Status: ${result.statusCode})`);
      });
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Get all test results
   */
  getTestResults(): TestResult[] {
    return this.testResults;
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults = [];
  }

  /**
   * Export test results to JSON
   */
  exportResults(filename: string = 'api-test-results.json'): void {
    const fs = require('fs');
    const path = require('path');
    
    // Save to test-runs folder
    const testRunsDir = 'test-runs';
    if (!fs.existsSync(testRunsDir)) {
      fs.mkdirSync(testRunsDir, { recursive: true });
    }
    
    const fullPath = path.join(testRunsDir, filename);
    const data = {
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        successRate: (this.testResults.filter(r => r.success).length / this.testResults.length) * 100
      }
    };
    
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    logger.info(`💾 Test results exported to ${fullPath}`);
  }
}

export default APITester; 