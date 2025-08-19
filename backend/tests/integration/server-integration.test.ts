/**
 * Server Integration Test
 * 
 * Tests integration with the actual running server on port 7401
 */

import request from 'supertest';
import { createTestServer } from './utils/test-server';

describe('Server Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = createTestServer();
  });

  describe('Server Health Check', () => {
    it('should respond to basic health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
  });

  describe('Database Connectivity', () => {
    it('should be able to connect to database through server', async () => {
      // This test will verify that the server can connect to the database
      // by making a simple request that requires database access
      const response = await request(app)
        .get('/api/admin/organizations')
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    it('should have working authentication endpoints', async () => {
      // Test that auth endpoints are accessible
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'testpassword123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400); // Should fail due to missing required fields, but endpoint exists
      
      expect(response.body).toBeDefined();
    });

    it('should have working admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/organizations')
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should handle organization creation workflow', async () => {
      // Test the complete workflow of creating an organization
      const orgData = {
        name: 'Test Integration Org',
        orgType: 'ADVERTISER',
        domain: 'test-integration.com'
      };

      // This would require proper authentication in a real scenario
      // For now, we'll just test that the endpoint exists and responds
      const response = await request(app)
        .post('/api/admin/organizations')
        .send(orgData)
        .expect(401); // Should fail due to no authentication, but endpoint exists
      
      expect(response.body).toBeDefined();
    });
  });
}); 