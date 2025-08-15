// Precision Ads API Testing Module
// Main entry point for all testing functionality

export { default as APITester } from './api-tester';
export { default as runTests } from './run-tests';
export { default as demo } from './demo';
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
  advancedAlgorithmsTestSuite,
  allTestSuites
} from './test-suites';

/**
 * Quick start function for testing
 * @param baseURL - Base URL of the server to test
 * @param testSuite - Test suite number (0 for all, 1-9 for specific suites)
 */
export async function quickTest(baseURL: string = 'http://localhost:3001', testSuite: number = 0) {
  const { default: runTests } = await import('./run-tests');
  return runTests();
}

/**
 * Run health check only
 * @param baseURL - Base URL of the server to test
 */
export async function healthCheck(baseURL: string = 'http://localhost:3001') {
  const { healthTestSuite } = await import('./test-suites');
  const tester = new (await import('./api-tester')).default(baseURL);
  return tester.runTestSuite(healthTestSuite);
}

/**
 * Run admin module tests
 * @param baseURL - Base URL of the server to test
 * @param authToken - JWT token for authentication
 */
export async function testAdminModule(baseURL: string = 'http://localhost:3001', authToken?: string) {
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
  baseURL: string = 'http://localhost:3001', 
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