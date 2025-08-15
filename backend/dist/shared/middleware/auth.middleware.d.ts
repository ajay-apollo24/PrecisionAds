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
export declare function rateLimit(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
declare const _default: {
    authenticateToken: typeof authenticateToken;
    requireRole: typeof requireRole;
    requireOrganizationAccess: typeof requireOrganizationAccess;
    canAccessOrganization: typeof canAccessOrganization;
    rateLimit: typeof rateLimit;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map