import { Request, Response, NextFunction } from 'express';
import { logRequest, logResponse } from './logger';

export interface RequestWithStartTime extends Request {
  startTime?: number;
}

export const requestLoggerMiddleware = (req: RequestWithStartTime, res: Response, next: NextFunction) => {
  // Record start time
  req.startTime = Date.now();
  
  // Log incoming request
  logRequest(req, {
    requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  });

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - (req.startTime || 0);
    
    // Log response
    logResponse(req, res, responseTime, {
      requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
    
    // Call original end method with proper return
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

export default requestLoggerMiddleware; 