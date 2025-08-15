import { Request, Response, NextFunction } from 'express';
export interface PublisherRequest extends Request {
    publisherId?: string;
    organizationId?: string;
}
export declare function requirePublisherAccess(req: PublisherRequest, res: Response, next: NextFunction): void;
export declare function requireSiteOwnership(req: PublisherRequest, res: Response, next: NextFunction): void;
export declare function requireAdUnitOwnership(req: PublisherRequest, res: Response, next: NextFunction): void;
export declare function checkPublisherPermissions(permissions: string[]): (req: PublisherRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=publisher-auth.middleware.d.ts.map