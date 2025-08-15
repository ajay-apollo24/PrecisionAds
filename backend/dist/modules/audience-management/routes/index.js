"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAudienceManagementRoutes = setupAudienceManagementRoutes;
const audience_segments_routes_1 = require("./audience-segments.routes");
const audience_insights_routes_1 = require("./audience-insights.routes");
const audience_targeting_routes_1 = require("./audience-targeting.routes");
const audience_optimization_routes_1 = require("./audience-optimization.routes");
function setupAudienceManagementRoutes(app, apiPrefix) {
    const audiencePrefix = `${apiPrefix}/audience-management`;
    (0, audience_segments_routes_1.setupAudienceSegmentsRoutes)(app, audiencePrefix);
    (0, audience_insights_routes_1.setupAudienceInsightsRoutes)(app, audiencePrefix);
    (0, audience_targeting_routes_1.setupAudienceTargetingRoutes)(app, audiencePrefix);
    (0, audience_optimization_routes_1.setupAudienceOptimizationRoutes)(app, audiencePrefix);
}
//# sourceMappingURL=index.js.map