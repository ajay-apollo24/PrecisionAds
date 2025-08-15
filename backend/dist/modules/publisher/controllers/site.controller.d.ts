import { Request, Response } from 'express';
export declare class SiteController {
    private siteService;
    constructor();
    getSites(req: Request, res: Response): Promise<void>;
    getSiteById(req: Request, res: Response): Promise<void>;
    createSite(req: Request, res: Response): Promise<void>;
    updateSite(req: Request, res: Response): Promise<void>;
    deleteSite(req: Request, res: Response): Promise<void>;
    getSiteStats(req: Request, res: Response): Promise<void>;
    getTopPerformingSites(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=site.controller.d.ts.map