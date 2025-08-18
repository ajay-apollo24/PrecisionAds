/**
 * Analytics Module - Unit Test Index
 * 
 * This file exports all unit tests for the analytics module.
 */

// Service Tests
export { default as analyticsServiceTests } from './analytics.service.test';

// Route Tests
export { default as analyticsRouteTests } from './performance-analytics.routes.test';

// Default export - all analytics tests
export default {
  service: () => import('./analytics.service.test'),
  routes: () => import('./performance-analytics.routes.test')
}; 