import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string;
    };
}
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(roles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireOrganizationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function canAccessOrganization(organizationId: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function rateLimit(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateBody(schema: Record<string, {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
}>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map