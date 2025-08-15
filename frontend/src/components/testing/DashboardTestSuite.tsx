import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { dashboardService } from '../../services/dashboard.service';
import { dashboardPerformanceTester } from '../../utils/dashboard-performance-test';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'RUNNING';
  duration: number;
  details: string;
  timestamp: string;
}

interface DashboardTestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  performanceScore: number;
  recommendations: string[];
}

export function DashboardTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<DashboardTestReport | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTest = async (testName: string, testFunction: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now();
    setCurrentTest(testName);
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        status: 'PASS',
        duration,
        details: 'Test completed successfully',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        status: 'FAIL',
        duration,
        details: error.message || 'Test failed',
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => [...prev, result]);
      return result;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setReport(null);
    
    console.log('🚀 Starting Dashboard Test Suite...');
    
    // Test 1: Organizations API
    await runTest('Organizations API', () => dashboardService.getOrganizations());
    
    // Test 2: Users API
    await runTest('Users API', () => dashboardService.getUsers());
    
    // Test 3: API Keys API
    await runTest('API Keys API', () => dashboardService.getAPIKeys());
    
    // Test 4: Dashboard Metrics API
    await runTest('Dashboard Metrics API', () => dashboardService.getDashboardMetrics());
    
    // Test 5: Performance Test
    const performanceReport = await dashboardPerformanceTester.runPerformanceTest();
    
    // Generate final report
    const passedTests = testResults.filter(r => r.status === 'PASS').length;
    const totalTests = testResults.length;
    const averageResponseTime = testResults.length > 0 
      ? Math.round(testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length)
      : 0;
    
    const finalReport: DashboardTestReport = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      averageResponseTime,
      performanceScore: performanceReport.performanceScore,
      recommendations: performanceReport.recommendations
    };
    
    setReport(finalReport);
    setIsRunning(false);
    setCurrentTest('');
    
    console.log('✅ Dashboard Test Suite completed!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-500';
      case 'FAIL': return 'bg-red-500';
      case 'RUNNING': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASS': return 'PASS';
      case 'FAIL': return 'FAIL';
      case 'RUNNING': return 'RUNNING';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing for dashboard functionality, performance, and user experience
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run comprehensive tests to verify dashboard functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Test:</span>
                <span className="font-medium">{currentTest}</span>
              </div>
              <Progress value={33} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Detailed results from each test execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(result.status)}`}></div>
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-muted-foreground">{result.details}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={result.status === 'PASS' ? 'default' : result.status === 'FAIL' ? 'destructive' : 'secondary'}>
                      {getStatusText(result.status)}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {result.duration}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Report */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Test Report</CardTitle>
            <CardDescription>
              Summary of all test results and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Test Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Tests:</span>
                      <span className="font-medium">{report.totalTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="font-medium text-green-600">{report.passedTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{report.failedTests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">
                        {((report.passedTests / report.totalTests) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Response Time:</span>
                      <span className="font-medium">{report.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Score:</span>
                      <span className="font-medium">{report.performanceScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                {report.recommendations.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific recommendations at this time.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Experience Tests */}
      <Card>
        <CardHeader>
          <CardTitle>User Experience Tests</CardTitle>
          <CardDescription>
            Manual tests to verify interface intuitiveness and responsiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Interface Responsiveness</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="responsive-check" />
                    <label htmlFor="responsive-check">Dashboard loads quickly (under 2 seconds)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="smooth-check" />
                    <label htmlFor="smooth-check">Animations and transitions are smooth</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="mobile-check" />
                    <label htmlFor="mobile-check">Responsive on mobile devices</label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Interface Intuitiveness</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="clear-check" />
                    <label htmlFor="clear-check">Navigation is clear and logical</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="helpful-check" />
                    <label htmlFor="helpful-check">Error messages are helpful</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="consistent-check" />
                    <label htmlFor="consistent-check">UI elements are consistent</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 