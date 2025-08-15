"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdvertiserRoutes = setupAdvertiserRoutes;
const campaigns_routes_1 = require("./campaigns.routes");
const ads_routes_1 = require("./ads.routes");
const audiences_routes_1 = require("./audiences.routes");
const analytics_routes_1 = require("./analytics.routes");
function setupAdvertiserRoutes(app, apiPrefix) {
    const advertiserPrefix = `${apiPrefix}/advertiser`;
    (0, campaigns_routes_1.setupCampaignRoutes)(app, advertiserPrefix);
    (0, ads_routes_1.setupAdsRoutes)(app, advertiserPrefix);
    (0, audiences_routes_1.setupAudiencesRoutes)(app, advertiserPrefix);
    (0, analytics_routes_1.setupAnalyticsRoutes)(app, advertiserPrefix);
}
//# sourceMappingURL=index.js.map