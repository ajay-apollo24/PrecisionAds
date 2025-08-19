/**
 * Integration Test Setup
 * 
 * This file runs before all integration tests to set up the test environment
 */

import { testDatabase } from './utils/test-database';

// Global setup for integration tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/precision_ads_test';
  
  console.log('🧪 Setting up integration test environment...');
  
  try {
    await testDatabase.setup();
    console.log('✅ Integration test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up integration test environment:', error);
    throw error;
  }
});

// Global teardown for integration tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  try {
    await testDatabase.cleanup();
    await testDatabase.close();
    console.log('✅ Integration test environment cleaned up');
  } catch (error) {
    console.error('❌ Failed to clean up integration test environment:', error);
  }
}); 