/**
 * Authentication API Tests
 * 
 * Tests the authentication endpoints of the API
 */

import request from 'supertest';
import { createTestServer } from '../helpers/test-server';
import { testUsers } from '../fixtures/test-data';

describe('Authentication API', () => {
  let app: any;

  beforeAll(async () => {
    app = createTestServer();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'USER'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
    });

    it('should return 400 for invalid user data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'USER'
      };

      // First registration should succeed
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: testUsers.advertiser.email,
        password: testUsers.advertiser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(credentials.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidCredentials = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.advertiser.email,
          password: testUsers.advertiser.password
        });

      const token = loginResponse.body.token;

      // Then logout
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('logged out');
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.advertiser.email,
          password: testUsers.advertiser.password
        });

      const token = loginResponse.body.token;

      // Get current user profile
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.advertiser.email);
    });

    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 