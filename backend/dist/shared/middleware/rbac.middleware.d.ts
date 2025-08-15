import { Request, Response, NextFunction } from 'express';
import { PermissionScope } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string;
    };
    organizationId?: string;
}
export interface RBACRequest extends AuthenticatedRequest {
    requiredPermissions?: PermissionScope[];
}
export declare const withOrganization: (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (permissions: PermissionScope[]) => (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: RBACRequest, res: Response, next: NextFunction) => void;
export declare const canAccessResource: (resourceType: string, resourceIdField?: string) => (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateAPIKey: (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const hasPermission: (userId: string, organizationId: string, permission: PermissionScope) => Promise<boolean>;
export declare const getUserPermissions: (userId: string, organizationId: string) => Promise<PermissionScope[]>;
declare const _default: {
    withOrganization: (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
    requirePermission: (permissions: PermissionScope[]) => (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (roles: string[]) => (req: RBACRequest, res: Response, next: NextFunction) => void;
    canAccessResource: (resourceType: string, resourceIdField?: string) => (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
    validateAPIKey: (req: RBACRequest, res: Response, next: NextFunction) => Promise<void>;
    hasPermission: (userId: string, organizationId: string, permission: PermissionScope) => Promise<boolean>;
    getUserPermissions: (userId: string, organizationId: string) => Promise<PermissionScope[]>;
};
export default _default;
//# sourceMappingURL=rbac.middleware.d.ts.map