#!/usr/bin/env tsx

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseURL = 'http://localhost:7401';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  details: string;
}

class AdminCRUDTester {
  private authToken: string | null = null;
  private testResults: TestResult[] = [];
  private testData: any = {};

  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Authenticating as superadmin...');
      const response = await axios.post(`${baseURL}/api/v1/auth/login`, {
        email: 'superadmin@precisionads.com',
        password: 'superadmin123'
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        console.log('✅ Authentication successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
    return false;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async testOrganizationsCRUD(): Promise<void> {
    console.log('\n🏢 Testing Organizations CRUD Operations...');
    
    // Test 1: Get all organizations
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/organizations`, {
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: 'Get All Organizations',
          status: 'PASS',
          responseTime,
          details: `Retrieved ${response.data.data.length} organizations`
        });
        console.log(`✅ Get All Organizations - PASSED (${responseTime}ms)`);
      } else {
        this.testResults.push({
          test: 'Get All Organizations',
          status: 'FAIL',
          responseTime,
          details: `Unexpected response: ${response.status}`
        });
        console.log(`❌ Get All Organizations - FAILED (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.testResults.push({
        test: 'Get All Organizations',
        status: 'FAIL',
        responseTime,
        details: `Error: ${error.message}`
      });
      console.log(`❌ Get All Organizations - FAILED (${responseTime}ms)`);
    }

    // Test 2: Get organizations with metrics
    const startTime2 = Date.now();
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/organizations/metrics`, {
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime2;
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: 'Get Organizations with Metrics',
          status: 'PASS',
          responseTime,
          details: `Retrieved metrics for ${response.data.data.length} organizations`
        });
        console.log(`✅ Get Organizations with Metrics - PASSED (${responseTime}ms)`);
      } else {
        this.testResults.push({
          test: 'Get Organizations with Metrics',
          status: 'FAIL',
          responseTime,
          details: `Unexpected response: ${response.status}`
        });
        console.log(`❌ Get Organizations with Metrics - FAILED (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime2;
      this.testResults.push({
        test: 'Get Organizations with Metrics',
        status: 'FAIL',
        responseTime,
        details: `Error: ${error.message}`
      });
      console.log(`❌ Get Organizations with Metrics - FAILED (${responseTime}ms)`);
    }
  }

  async testUsersCRUD(): Promise<void> {
    console.log('\n👥 Testing Users CRUD Operations...');
    
    // Test 1: Get all users
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/users`, {
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: 'Get All Users',
          status: 'PASS',
          responseTime,
          details: `Retrieved ${response.data.data.length} users`
        });
        console.log(`✅ Get All Users - PASSED (${responseTime}ms)`);
      } else {
        this.testResults.push({
          test: 'Get All Users',
          status: 'FAIL',
          responseTime,
          details: `Unexpected response: ${response.status}`
        });
        console.log(`❌ Get All Users - FAILED (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.testResults.push({
        test: 'Get All Users',
        status: 'FAIL',
        responseTime,
        details: `Error: ${error.message}`
      });
      console.log(`❌ Get All Users - FAILED (${responseTime}ms)`);
    }

    // Test 2: Get users by role
    const startTime2 = Date.now();
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/users/role/ADMIN`, {
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime2;
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: 'Get Users by Role',
          status: 'PASS',
          responseTime,
          details: `Retrieved ${response.data.data.length} admin users`
        });
        console.log(`✅ Get Users by Role - PASSED (${responseTime}ms)`);
      } else {
        this.testResults.push({
          test: 'Get Users by Role',
          status: 'FAIL',
          responseTime,
          details: `Unexpected response: ${response.status}`
        });
        console.log(`❌ Get Users by Role - FAILED (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime2;
      this.testResults.push({
        test: 'Get Users by Role',
        status: 'FAIL',
        responseTime,
        details: `Error: ${error.message}`
      });
      console.log(`❌ Get Users by Role - FAILED (${responseTime}ms)`);
    }
  }

  async testAPIKeysCRUD(): Promise<void> {
    console.log('\n🔑 Testing API Keys CRUD Operations...');
    
    // Test 1: Get all API keys
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/api-keys`, {
        headers: this.getHeaders()
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({
          test: 'Get All API Keys',
          status: 'PASS',
          responseTime,
          details: `Retrieved ${response.data.data.length} API keys`
        });
        console.log(`✅ Get All API Keys - PASSED (${responseTime}ms)`);
      } else {
        this.testResults.push({
          test: 'Get All API Keys',
          status: 'FAIL',
          responseTime,
          details: `Unexpected response: ${response.status}`
        });
        console.log(`❌ Get All API Keys - FAILED (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.testResults.push({
        test: 'Get All API Keys',
        status: 'FAIL',
        responseTime,
        details: `Error: ${error.message}`
      });
      console.log(`❌ Get All API Keys - FAILED (${responseTime}ms)`);
    }
  }

  async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance...');
    
    const endpoints = [
      '/api/v1/admin/organizations',
      '/api/v1/admin/users',
      '/api/v1/admin/api-keys',
      '/api/v1/admin/organizations/metrics'
    ];

    const performanceResults: { endpoint: string; avgTime: number; minTime: number; maxTime: number }[] = [];

    for (const endpoint of endpoints) {
      const times: number[] = [];
      
      // Test each endpoint 5 times to get average performance
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        try {
          await axios.get(`${baseURL}${endpoint}`, {
            headers: this.getHeaders()
          });
          const responseTime = Date.now() - startTime;
          times.push(responseTime);
        } catch (error) {
          console.log(`⚠️  Skipping performance test for ${endpoint} due to error`);
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        performanceResults.push({
          endpoint,
          avgTime: Math.round(avgTime),
          minTime,
          maxTime
        });

        console.log(`${endpoint}: Avg: ${Math.round(avgTime)}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
      }
    }

    // Check if performance meets requirements
    const slowEndpoints = performanceResults.filter(r => r.avgTime > 500);
    if (slowEndpoints.length === 0) {
      this.testResults.push({
        test: 'Performance Test',
        status: 'PASS',
        responseTime: 0,
        details: `All endpoints respond within 500ms average`
      });
      console.log('✅ Performance Test - PASSED');
    } else {
      this.testResults.push({
        test: 'Performance Test',
        status: 'FAIL',
        responseTime: 0,
        details: `${slowEndpoints.length} endpoints are slow (>500ms)`
      });
      console.log('❌ Performance Test - FAILED');
    }
  }

  async testErrorHandling(): Promise<void> {
    console.log('\n🚨 Testing Error Handling...');
    
    // Test 1: Unauthorized access
    const startTime = Date.now();
    try {
      await axios.get(`${baseURL}/api/v1/admin/organizations`);
      this.testResults.push({
        test: 'Unauthorized Access',
        status: 'FAIL',
        responseTime: Date.now() - startTime,
        details: 'Should have returned 401 but succeeded'
      });
      console.log('❌ Unauthorized Access - FAILED');
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      if (error.response?.status === 401) {
        this.testResults.push({
          test: 'Unauthorized Access',
          status: 'PASS',
          responseTime,
          details: 'Correctly returned 401 for unauthorized access'
        });
        console.log('✅ Unauthorized Access - PASSED');
      } else {
        this.testResults.push({
          test: 'Unauthorized Access',
          status: 'FAIL',
          responseTime,
          details: `Expected 401 but got ${error.response?.status}`
        });
        console.log('❌ Unauthorized Access - FAILED');
      }
    }

    // Test 2: Invalid endpoint
    const startTime2 = Date.now();
    try {
      await axios.get(`${baseURL}/api/v1/admin/invalid-endpoint`, {
        headers: this.getHeaders()
      });
      this.testResults.push({
        test: 'Invalid Endpoint',
        status: 'FAIL',
        responseTime: Date.now() - startTime2,
        details: 'Should have returned 404 but succeeded'
      });
      console.log('❌ Invalid Endpoint - FAILED');
    } catch (error: any) {
      const responseTime = Date.now() - startTime2;
      if (error.response?.status === 404) {
        this.testResults.push({
          test: 'Invalid Endpoint',
          status: 'PASS',
          responseTime,
          details: 'Correctly returned 404 for invalid endpoint'
        });
        console.log('✅ Invalid Endpoint - PASSED');
      } else {
        this.testResults.push({
          test: 'Invalid Endpoint',
          status: 'FAIL',
          responseTime,
          details: `Expected 404 but got ${error.response?.status}`
        });
        console.log('❌ Invalid Endpoint - FAILED');
      }
    }
  }

  printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ADMIN CRUD TESTING RESULTS');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.details}`);
        });
    }
    
    console.log('\n✅ Passed Tests:');
    this.testResults
      .filter(r => r.status === 'PASS')
      .forEach(result => {
        console.log(`   • ${result.test} (${result.responseTime}ms): ${result.details}`);
      });
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Admin CRUD Testing Suite...');
    console.log(`🌐 Base URL: ${baseURL}`);
    console.log('='.repeat(60));
    
    if (!await this.authenticate()) {
      console.log('❌ Authentication failed. Cannot proceed with tests.');
      return;
    }
    
    await this.testOrganizationsCRUD();
    await this.testUsersCRUD();
    await this.testAPIKeysCRUD();
    await this.testPerformance();
    await this.testErrorHandling();
    
    this.printResults();
  }
}

// Run the tests
async function main() {
  const tester = new AdminCRUDTester();
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
} 