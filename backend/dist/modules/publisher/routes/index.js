"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPublisherRoutes = setupPublisherRoutes;
const sites_routes_1 = require("./sites.routes");
const ad_units_routes_1 = require("./ad-units.routes");
const ad_requests_routes_1 = require("./ad-requests.routes");
const earnings_routes_1 = require("./earnings.routes");
const tracking_routes_1 = require("./tracking.routes");
function setupPublisherRoutes(app, apiPrefix) {
    const publisherPrefix = `${apiPrefix}/publisher`;
    (0, sites_routes_1.setupSiteRoutes)(app, publisherPrefix);
    (0, ad_units_routes_1.setupAdUnitRoutes)(app, publisherPrefix);
    (0, ad_requests_routes_1.setupAdRequestRoutes)(app, publisherPrefix);
    (0, earnings_routes_1.setupEarningsRoutes)(app, publisherPrefix);
    (0, tracking_routes_1.setupTrackingRoutes)(app, publisherPrefix);
}
//# sourceMappingURL=index.js.map