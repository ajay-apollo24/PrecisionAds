/**
 * Test Server Utility
 * 
 * Provides utilities for starting and stopping test servers
 * for integration tests.
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupRoutes } from '../../../src/app';
import { errorHandler } from '../../../src/shared/middleware/error-handler';

export function createTestServer(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  setupRoutes(app);
  app.use(errorHandler);
  return app;
} 