"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAnalyticsReportingRoutes = setupAnalyticsReportingRoutes;
const performance_analytics_routes_1 = require("./performance-analytics.routes");
function setupAnalyticsReportingRoutes(app, apiPrefix) {
    const analyticsPrefix = `${apiPrefix}/analytics-reporting`;
    (0, performance_analytics_routes_1.setupPerformanceAnalyticsRoutes)(app, analyticsPrefix);
}
//# sourceMappingURL=index.js.map