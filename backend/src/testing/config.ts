export interface TestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  delayBetweenTests: number;
  delayBetweenSuites: number;
  exportResults: boolean;
  exportFormat: 'json' | 'csv' | 'html';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  auth: {
    enabled: boolean;
    token?: string;
    apiKey?: string;
    organizationId?: string;
  };
  performance: {
    enabled: boolean;
    iterations: number;
    threshold: number; // ms
  };
}

export const defaultTestConfig: TestConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:7401',
  timeout: parseInt(process.env.TEST_TIMEOUT || '10000'),
  retries: parseInt(process.env.TEST_RETRIES || '1'),
  delayBetweenTests: parseInt(process.env.TEST_DELAY_BETWEEN_TESTS || '100'),
  delayBetweenSuites: parseInt(process.env.TEST_DELAY_BETWEEN_SUITES || '500'),
  exportResults: process.env.TEST_EXPORT_RESULTS !== 'false',
  exportFormat: (process.env.TEST_EXPORT_FORMAT as 'json' | 'csv' | 'html') || 'json',
  logLevel: (process.env.TEST_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  auth: {
    enabled: process.env.TEST_AUTH_ENABLED === 'true',
    token: process.env.TEST_AUTH_TOKEN,
    apiKey: process.env.TEST_API_KEY,
    organizationId: process.env.TEST_ORGANIZATION_ID,
  },
  performance: {
    enabled: process.env.TEST_PERFORMANCE_ENABLED === 'true',
    iterations: parseInt(process.env.TEST_PERFORMANCE_ITERATIONS || '5'),
    threshold: parseInt(process.env.TEST_PERFORMANCE_THRESHOLD || '1000'),
  },
};

export function loadTestConfig(): TestConfig {
  // Load from environment variables
  const config = { ...defaultTestConfig };
  
  // Override with environment variables if present
  if (process.env.TEST_BASE_URL) config.baseURL = process.env.TEST_BASE_URL;
  if (process.env.TEST_TIMEOUT) config.timeout = parseInt(process.env.TEST_TIMEOUT);
  if (process.env.TEST_RETRIES) config.retries = parseInt(process.env.TEST_RETRIES);
  if (process.env.TEST_AUTH_TOKEN) config.auth.token = process.env.TEST_AUTH_TOKEN;
  if (process.env.TEST_API_KEY) config.auth.apiKey = process.env.TEST_API_KEY;
  if (process.env.TEST_ORGANIZATION_ID) config.auth.organizationId = process.env.TEST_ORGANIZATION_ID;
  
  return config;
}

export function validateTestConfig(config: TestConfig): string[] {
  const errors: string[] = [];
  
  if (!config.baseURL) {
    errors.push('TEST_BASE_URL is required');
  }
  
  if (config.timeout < 1000) {
    errors.push('TEST_TIMEOUT must be at least 1000ms');
  }
  
  if (config.retries < 0) {
    errors.push('TEST_RETRIES must be non-negative');
  }
  
  if (config.auth.enabled) {
    if (!config.auth.token && !config.auth.apiKey) {
      errors.push('TEST_AUTH_TOKEN or TEST_API_KEY is required when auth is enabled');
    }
    if (!config.auth.organizationId) {
      errors.push('TEST_ORGANIZATION_ID is required when auth is enabled');
    }
  }
  
  return errors;
}

export function printTestConfig(config: TestConfig): void {
  console.log('🔧 Test Configuration:');
  console.log(`   Base URL: ${config.baseURL}`);
  console.log(`   Timeout: ${config.timeout}ms`);
  console.log(`   Retries: ${config.retries}`);
  console.log(`   Delay between tests: ${config.delayBetweenTests}ms`);
  console.log(`   Delay between suites: ${config.delayBetweenSuites}ms`);
  console.log(`   Export results: ${config.exportResults}`);
  console.log(`   Export format: ${config.exportFormat}`);
  console.log(`   Log level: ${config.logLevel}`);
  console.log(`   Auth enabled: ${config.auth.enabled}`);
  if (config.auth.enabled) {
    console.log(`   Organization ID: ${config.auth.organizationId}`);
    console.log(`   Has token: ${!!config.auth.token}`);
    console.log(`   Has API key: ${!!config.auth.apiKey}`);
  }
  console.log(`   Performance testing: ${config.performance.enabled}`);
  if (config.performance.enabled) {
    console.log(`   Performance iterations: ${config.performance.iterations}`);
    console.log(`   Performance threshold: ${config.performance.threshold}ms`);
  }
  console.log('');
}

export default defaultTestConfig; 