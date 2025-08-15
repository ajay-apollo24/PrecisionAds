import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with enhanced context
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    module: req.url.split('/')[2] || 'unknown', // Extract module from URL
    endpoint: req.url.split('/').slice(2).join('/') || 'unknown',
    timestamp: new Date().toISOString(),
    errorType: err.constructor.name,
    statusCode: statusCode
  });

  // Don't leak error details in production
  const errorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    },
    timestamp: new Date().toISOString(),
    path: req.url
  };

  res.status(statusCode).json(errorResponse);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}; 