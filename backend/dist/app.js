"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const routes_1 = require("./modules/publisher/routes");
const routes_2 = require("./modules/advertiser/routes");
const routes_3 = require("./modules/ad-serving/routes");
const routes_4 = require("./modules/audience-management/routes");
const routes_5 = require("./modules/analytics-reporting/routes");
const routes_6 = require("./modules/advanced-ad-algorithms/routes");
const routes_7 = require("./modules/admin/routes");
const routes_8 = require("./shared/routes");
function setupRoutes(app) {
    const apiPrefix = '/api/v1';
    (0, routes_1.setupPublisherRoutes)(app, apiPrefix);
    (0, routes_2.setupAdvertiserRoutes)(app, apiPrefix);
    (0, routes_3.setupAdServingRoutes)(app, apiPrefix);
    (0, routes_4.setupAudienceManagementRoutes)(app, apiPrefix);
    (0, routes_5.setupAnalyticsReportingRoutes)(app, apiPrefix);
    (0, routes_6.setupAdvancedAdAlgorithmsRoutes)(app, apiPrefix);
    (0, routes_7.setupAdminRoutes)(app, apiPrefix);
    (0, routes_8.setupSharedRoutes)(app, apiPrefix);
    app.get(`${apiPrefix}/docs`, (req, res) => {
        res.json({
            message: 'Precision Ads API Documentation',
            version: '1.0.0',
            endpoints: {
                publisher: `${apiPrefix}/publisher`,
                advertiser: `${apiPrefix}/advertiser`,
                adServing: `${apiPrefix}/ad-serving`,
                audienceManagement: `${apiPrefix}/audience-management`,
                analyticsReporting: `${apiPrefix}/analytics-reporting`,
                advancedAlgorithms: `${apiPrefix}/advanced-algorithms`,
                admin: `${apiPrefix}/admin`,
                shared: `${apiPrefix}/shared`
            },
            features: {
                core: ['Publisher Management', 'Advertiser Management', 'Ad Serving'],
                advanced: [
                    'Audience Management & Segmentation',
                    'Advanced Analytics & Reporting',
                    'Retargeting Algorithms',
                    'Real-Time Bidding (RTB)',
                    'Programmatic Advertising',
                    'Predictive Bidding',
                    'AI-Powered Optimization'
                ]
            }
        });
    });
}
//# sourceMappingURL=app.js.map