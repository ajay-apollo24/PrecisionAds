/**
 * Integration Tests Index
 * 
 * This file provides integration tests that test the interaction between
 * different services and modules within the application.
 */

export * from './analytics/analytics-integration.test';
export * from './audience-management/audience-integration.test';
export * from './ad-serving/ad-serving-integration.test';
export * from './advertiser/advertiser-integration.test';
export * from './admin/admin-integration.test';
export * from './publisher/publisher-integration.test';
export * from './shared/shared-integration.test';

// Integration test utilities
export * from './utils/test-database';
export * from './utils/test-server';
export * from './utils/test-data-factory'; 