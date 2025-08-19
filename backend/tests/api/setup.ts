/**
 * API Test Setup
 * 
 * This file runs before all API tests to set up the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for testing

console.log('🧪 Setting up API test environment...');

// Global test timeout
jest.setTimeout(30000);

// Mock external services if needed
jest.mock('../../../src/shared/services/websocket.service', () => ({
  WebSocketService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    broadcast: jest.fn(),
    close: jest.fn()
  }))
}));

console.log('✅ API test environment ready'); 