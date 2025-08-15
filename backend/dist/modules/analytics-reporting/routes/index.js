"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAnalyticsReportingRoutes = setupAnalyticsReportingRoutes;
const performance_analytics_routes_1 = require("./performance-analytics.routes");
const revenue_analytics_routes_1 = require("./revenue-analytics.routes");
const user_analytics_routes_1 = require("./user-analytics.routes");
const custom_reports_routes_1 = require("./custom-reports.routes");
const realtime_analytics_routes_1 = require("./realtime-analytics.routes");
function setupAnalyticsReportingRoutes(app, apiPrefix) {
    const analyticsPrefix = `${apiPrefix}/analytics-reporting`;
    (0, performance_analytics_routes_1.setupPerformanceAnalyticsRoutes)(app, analyticsPrefix);
    (0, revenue_analytics_routes_1.setupRevenueAnalyticsRoutes)(app, analyticsPrefix);
    (0, user_analytics_routes_1.setupUserAnalyticsRoutes)(app, analyticsPrefix);
    (0, custom_reports_routes_1.setupCustomReportsRoutes)(app, analyticsPrefix);
    (0, realtime_analytics_routes_1.setupRealTimeAnalyticsRoutes)(app, analyticsPrefix);
}
//# sourceMappingURL=index.js.map