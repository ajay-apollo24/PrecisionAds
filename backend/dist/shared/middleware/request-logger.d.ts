import { Request, Response, NextFunction } from 'express';
export interface RequestWithStartTime extends Request {
    startTime?: number;
}
export declare const requestLoggerMiddleware: (req: RequestWithStartTime, res: Response, next: NextFunction) => void;
export default requestLoggerMiddleware;
//# sourceMappingURL=request-logger.d.ts.map