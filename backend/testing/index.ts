// Precision Ads API Testing Module
// Main entry point for all testing functionality

export { default as APITester } from './api-tester';
export { default as runTests } from './run-tests';
export { default as demo } from './demo';
export { default as ComprehensiveTestRunner } from './run-comprehensive-tests';
export { default as defaultTestConfig, loadTestConfig, validateTestConfig, printTestConfig } from './config';
export type { TestResult, TestSuite, TestCase } from './api-tester';
export type { TestConfig } from './config';

// Test suites
export {
  healthTestSuite,
  authTestSuite,
  adminTestSuite,
  canonicalTestSuite,
  publisherTestSuite,
  adServingTestSuite,
  analyticsTestSuite,
  audienceTestSuite,
  advertiserTestSuite,
  advancedAlgorithmsTestSuite,
  allTestSuites
} from './test-suites';

/**
 * Quick start function for testing
 * @param baseURL - Base URL of the server to test
 * @param testSuite - Test suite number (0 for all, 1-9 for specific suites)
 */
export async function quickTest(baseURL: string = 'http://localhost:7401', testSuite: number = 0) {
  const { default: runTests } = await import('./run-tests');
  return runTests();
}

/**
 * Run health check only
 * @param baseURL - Base URL of the server to test
 */
export async function healthCheck(baseURL: string = 'http://localhost:7401') {
  const { healthTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  return tester.runTestSuite(healthTestSuite);
}

/**
 * Run admin module tests
 * @param baseURL - Base URL of the server to test
 * @param authToken - JWT token for authentication
 */
export async function testAdminModule(baseURL: string = 'http://localhost:7401', authToken?: string) {
  const { adminTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  if (authToken) {
    tester.setAuthToken(authToken);
  }
  
  return tester.runTestSuite(adminTestSuite);
}

/**
 * Run canonical specification tests
 * @param baseURL - Base URL of the server to test
 * @param apiKey - API key for authentication
 * @param organizationId - Organization ID for context
 */
export async function testCanonicalSpec(
  baseURL: string = 'http://localhost:7401', 
  apiKey?: string, 
  organizationId?: string
) {
  const { canonicalTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  // Note: API key and organization ID need to be set in test headers
  // This is a limitation of the current implementation
  // Future versions will support dynamic header injection
  
  return tester.runTestSuite(canonicalTestSuite);
}

/**
 * Run analytics module tests
 * @param baseURL - Base URL of the server to test
 */
export async function testAnalyticsModule(baseURL: string = 'http://localhost:7401') {
  const { analyticsTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  return tester.runTestSuite(analyticsTestSuite);
}

/**
 * Run audience management module tests
 * @param baseURL - Base URL of the server to test
 */
export async function testAudienceModule(baseURL: string = 'http://localhost:7401') {
  const { audienceTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  return tester.runTestSuite(audienceTestSuite);
}

/**
 * Run ad serving module tests
 * @param baseURL - Base URL of the server to test
 */
export async function testAdServingModule(baseURL: string = 'http://localhost:7401') {
  const { adServingTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  return tester.runTestSuite(adServingTestSuite);
}

/**
 * Run advertiser module tests
 * @param baseURL - Base URL of the server to test
 */
export async function testAdvertiserModule(baseURL: string = 'http://localhost:7401') {
  const { advertiserTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  return tester.runTestSuite(advertiserTestSuite);
}

/**
 * Run advanced algorithms module tests
 * @param baseURL - Base URL of the server to test
 */
export async function testAdvancedAlgorithmsModule(baseURL: string = 'http://localhost:7401') {
  const { advancedAlgorithmsTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  
  return tester.runTestSuite(advancedAlgorithmsTestSuite);
}

/**
 * Run comprehensive tests (unit + API)
 * @param baseURL - Base URL of the server to test
 * @param categories - Specific test categories to run
 */
export async function runComprehensiveTests(
  baseURL: string = 'http://localhost:7401',
  categories?: string[]
) {
  const ComprehensiveTestRunner = (await import('./run-comprehensive-tests')).default;
  const runner = new ComprehensiveTestRunner(baseURL);
  
  if (categories && categories.length > 0) {
    return await runner.runSpecificTests(categories);
  } else {
    return await runner.runAllTests();
  }
}

/**
 * Get test configuration
 */
export function getTestConfig() {
  const { loadTestConfig, validateTestConfig, printTestConfig } = require('./config');
  const config = loadTestConfig();
  const errors = validateTestConfig(config);
  
  if (errors.length > 0) {
    console.error('❌ Test configuration errors:');
    errors.forEach((err: string) => console.error(`   • ${err}`));
    return null;
  }
  
  return config;
}

/**
 * Print current test configuration
 */
export function printConfig() {
  const { loadTestConfig, printTestConfig } = require('./config');
  const config = loadTestConfig();
  printTestConfig(config);
}

// Default export for convenience
export default {
  APITester: require('./api-tester').default,
  runTests: require('./run-tests').default,
  demo: require('./demo').default,
  quickTest,
  healthCheck,
  testAdminModule,
  testCanonicalSpec,
  getTestConfig,
  printConfig,
  config: require('./config').default
}; 