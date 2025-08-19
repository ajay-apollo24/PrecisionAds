/**
 * Test Server Helper
 * 
 * Creates an Express app instance for API testing
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupRoutes } from '../../../src/app';
import { errorHandler } from '../../../src/shared/middleware/error-handler';

export function createTestServer(): Express {
  const app = express();

  // Basic middleware for testing
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup routes
  setupRoutes(app);

  // Error handling
  app.use(errorHandler);

  return app;
} 