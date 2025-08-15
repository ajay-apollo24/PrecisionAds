import { dashboardService } from '../services/dashboard.service';

export interface PerformanceMetrics {
  endpoint: string;
  responseTime: number;
  success: boolean;
  error?: string;
}

export interface DashboardPerformanceReport {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  performanceScore: number; // 0-100
  recommendations: string[];
}

class DashboardPerformanceTester {
  private results: PerformanceMetrics[] = [];

  async testEndpointPerformance(endpoint: string, testFunction: () => Promise<any>): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    let success = false;
    let error: string | undefined;

    try {
      await testFunction();
      success = true;
    } catch (err: any) {
      error = err.message || 'Unknown error';
    }

    const responseTime = performance.now() - startTime;
    
    const result: PerformanceMetrics = {
      endpoint,
      responseTime: Math.round(responseTime),
      success,
      error
    };

    this.results.push(result);
    return result;
  }

  async testAllEndpoints(): Promise<void> {
    console.log('🚀 Starting Dashboard Performance Testing...');
    console.log('='.repeat(60));

    // Test Organizations endpoint
    await this.testEndpointPerformance(
      'Get Organizations',
      () => dashboardService.getOrganizations()
    );

    // Test Users endpoint
    await this.testEndpointPerformance(
      'Get Users',
      () => dashboardService.getUsers()
    );

    // Test API Keys endpoint
    await this.testEndpointPerformance(
      'Get API Keys',
      () => dashboardService.getAPIKeys()
    );

    // Test Dashboard Metrics endpoint
    await this.testEndpointPerformance(
      'Get Dashboard Metrics',
      () => dashboardService.getDashboardMetrics()
    );

    // Test Organizations with Metrics endpoint
    await this.testEndpointPerformance(
      'Get Organizations with Metrics',
      () => dashboardService.getOrganizations()
    );
  }

  generateReport(): DashboardPerformanceReport {
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const totalTests = this.results.length;

    const successfulResults = this.results.filter(r => r.success);
    const averageResponseTime = successfulResults.length > 0 
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length)
      : 0;

    const slowestEndpoint = successfulResults.length > 0
      ? successfulResults.reduce((slowest, current) => 
          current.responseTime > slowest.responseTime ? current : slowest
        ).endpoint
      : 'N/A';

    const fastestEndpoint = successfulResults.length > 0
      ? successfulResults.reduce((fastest, current) => 
          current.responseTime < fastest.responseTime ? current : fastest
        ).endpoint
      : 'N/A';

    // Calculate performance score (0-100)
    let performanceScore = 100;
    
    // Deduct points for failed tests
    performanceScore -= (failedTests / totalTests) * 40;
    
    // Deduct points for slow responses
    if (averageResponseTime > 1000) performanceScore -= 30;
    else if (averageResponseTime > 500) performanceScore -= 20;
    else if (averageResponseTime > 200) performanceScore -= 10;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failedTests > 0) {
      recommendations.push('Fix failed API endpoints to improve reliability');
    }
    
    if (averageResponseTime > 1000) {
      recommendations.push('Optimize API response times - consider caching or database optimization');
    } else if (averageResponseTime > 500) {
      recommendations.push('Monitor API performance - response times are acceptable but could be improved');
    }
    
    if (successfulTests === totalTests && averageResponseTime < 200) {
      recommendations.push('Excellent performance! Consider implementing real-time updates for better UX');
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime,
      slowestEndpoint,
      fastestEndpoint,
      performanceScore: Math.max(0, Math.round(performanceScore)),
      recommendations
    };
  }

  printResults(): void {
    console.log('\n📊 Dashboard Performance Test Results');
    console.log('='.repeat(60));
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const time = result.responseTime;
      const error = result.error ? ` - ${result.error}` : '';
      console.log(`${status} ${result.endpoint}: ${time}ms${error}`);
    });

    const report = this.generateReport();
    
    console.log('\n📈 Performance Summary');
    console.log('='.repeat(40));
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`✅ Successful: ${report.successfulTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`📊 Success Rate: ${((report.successfulTests / report.totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️  Average Response Time: ${report.averageResponseTime}ms`);
    console.log(`🐌 Slowest Endpoint: ${report.slowestEndpoint}`);
    console.log(`⚡ Fastest Endpoint: ${report.fastestEndpoint}`);
    console.log(`🏆 Performance Score: ${report.performanceScore}/100`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
  }

  async runPerformanceTest(): Promise<DashboardPerformanceReport> {
    await this.testAllEndpoints();
    this.printResults();
    return this.generateReport();
  }
}

// Export for use in components
export const dashboardPerformanceTester = new DashboardPerformanceTester();

// Run standalone test if called directly
if (typeof window !== 'undefined') {
  // Browser environment - expose for testing
  (window as any).dashboardPerformanceTester = dashboardPerformanceTester;
} else {
  // Node environment - run test
  dashboardPerformanceTester.runPerformanceTest()
    .then(report => {
      console.log('\n🎉 Performance testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Performance testing failed:', error);
      process.exit(1);
    });
} 