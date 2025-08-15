import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './shared/middleware/error-handler';
import { logger } from './shared/middleware/logger';
import { setupRoutes } from './app';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7401;
const apiPrefix = '/api/v1';

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple origins for development
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:7400',
  'http://localhost:7400',  // Frontend port
  'http://localhost:5173',  // Alternative frontend port
  'http://localhost:3000'   // Fallback
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Organization-Id']
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute for development
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per minute for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and OPTIONS requests
    return req.path === '/health' || req.method === 'OPTIONS';
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Simple request counter for debugging
let requestCount = 0;
app.use((req: Request, res: Response, next: NextFunction) => {
  requestCount++;
  if (requestCount % 10 === 0) { // Log every 10th request
    logger.info(`Request count: ${requestCount}, Current path: ${req.path}`);
  }
  next();
});

// Detailed request logging for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only log for admin routes to avoid spam
  if (req.path.startsWith('/api/v1/admin')) {
    console.log('📥 Incoming Request Details:', {
      method: req.method,
      path: req.path,
      headers: {
        authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 50)}...` : 'none',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      body: req.body ? Object.keys(req.body) : 'no body',
      query: req.query ? Object.keys(req.query) : 'no query'
    });
  }
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Setup application routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  logger.warn(`Available routes: ${apiPrefix}/admin/*, ${apiPrefix}/auth/*, ${apiPrefix}/publisher/*, ${apiPrefix}/advertiser/*`);
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      `${apiPrefix}/admin/organizations`,
      `${apiPrefix}/admin/users`, 
      `${apiPrefix}/admin/api-keys`,
      `${apiPrefix}/auth/login`,
      `${apiPrefix}/auth/organizations`,
      `${apiPrefix}/publisher/sites`,
      `${apiPrefix}/advertiser/campaigns`
    ]
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Precision Ads Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

export default app; 