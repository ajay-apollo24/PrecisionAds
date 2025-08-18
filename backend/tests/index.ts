/**
 * Precision Ads Backend - Unified Test Index
 * 
 * This file provides a centralized entry point for all testing functionality,
 * organizing tests by type, module, and purpose.
 */

// ============================================================================
// TEST CATEGORIES
// ============================================================================

export const TEST_CATEGORIES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  API: 'api',
  E2E: 'e2e',
  PERFORMANCE: 'performance'
} as const;

export type TestCategory = typeof TEST_CATEGORIES[keyof typeof TEST_CATEGORIES];

export const TEST_MODULES = {
  ANALYTICS: 'analytics',
  AUDIENCE_MANAGEMENT: 'audience-management',
  AD_SERVING: 'ad-serving',
  ADVERTISER: 'advertiser',
  ADVANCED_ALGORITHMS: 'advanced-algorithms',
  ADMIN: 'admin',
  PUBLISHER: 'publisher',
  SHARED: 'shared'
} as const;

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const TEST_CONFIG = {
  // Test execution settings
  TIMEOUT: 30000,
  RETRIES: 2,
  PARALLEL: true,
  
  // Coverage thresholds
  COVERAGE_THRESHOLDS: {
    STATEMENTS: 90,
    BRANCHES: 85,
    FUNCTIONS: 90,
    LINES: 90
  },
  
  // Test data settings
  TEST_DATA: {
    CLEANUP_AFTER_EACH: true,
    USE_TEST_DATABASE: true,
    MOCK_EXTERNAL_APIS: true
  }
} as const;

// ============================================================================
// QUICK ACCESS FUNCTIONS
// ============================================================================

/**
 * Run comprehensive test suite
 */
export async function runComprehensiveTests(options: {
  categories?: (keyof typeof TEST_CATEGORIES)[];
  modules?: (keyof typeof TEST_MODULES)[];
  parallel?: boolean;
  coverage?: boolean;
} = {}) {
  const { ComprehensiveTestRunner } = await import('./utils/runners/comprehensive-test-runner');
  const runner = new ComprehensiveTestRunner(options);
  return await runner.runAllTests();
}

/**
 * Run Jest unit tests
 */
export async function runUnitTests() {
  const { execSync } = require('child_process');
  
  console.log('🧪 Running Jest Unit Tests...');
  console.log('=====================================');
  
  try {
    const output = execSync('npm test -- --coverage --silent', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('✅ Jest tests completed successfully');
    return { success: true, output };
    
  } catch (error: any) {
    console.error('❌ Jest tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run API integration tests
 */
export async function runAPITests() {
  try {
    const { default: ComprehensiveTestRunner } = await import('../testing/run-comprehensive-tests');
    const runner = new ComprehensiveTestRunner('http://localhost:7401');
    return await runner.runAllTests();
    
  } catch (error: any) {
    console.error('❌ API tests failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests for a specific module
 */
export async function runModuleTests(module: keyof typeof TEST_MODULES, category: TestCategory = 'unit') {
  switch (category) {
    case 'unit':
      return await runUnitTests();
    case 'api':
      return await runAPITests();
    default:
      throw new Error(`Unknown test category: ${category}`);
  }
}

/**
 * Run all tests for a specific category
 */
export async function runCategoryTests(category: TestCategory) {
  switch (category) {
    case 'unit':
      return await runUnitTests();
    case 'api':
      return await runAPITests();
    case 'e2e':
    case 'performance':
      console.log(`⚠️  ${category} tests not implemented yet`);
      return { success: false, message: 'Not implemented' };
    default:
      throw new Error(`Unknown test category: ${category}`);
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Test categories
  categories: TEST_CATEGORIES,
  modules: TEST_MODULES,
  config: TEST_CONFIG,
  
  // Quick access functions
  runModuleTests,
  runCategoryTests,
  runComprehensiveTests,
  
  // Test runners
  runUnitTests,
  runAPITests
}; 