"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdvancedAdAlgorithmsRoutes = setupAdvancedAdAlgorithmsRoutes;
const retargeting_routes_1 = require("./retargeting.routes");
const rtb_routes_1 = require("./rtb.routes");
const programmatic_routes_1 = require("./programmatic.routes");
const predictive_bidding_routes_1 = require("./predictive-bidding.routes");
const ai_optimization_routes_1 = require("./ai-optimization.routes");
function setupAdvancedAdAlgorithmsRoutes(app, apiPrefix) {
    const algorithmsPrefix = `${apiPrefix}/advanced-algorithms`;
    (0, retargeting_routes_1.setupRetargetingRoutes)(app, algorithmsPrefix);
    (0, rtb_routes_1.setupRTBRoutes)(app, algorithmsPrefix);
    (0, programmatic_routes_1.setupProgrammaticRoutes)(app, algorithmsPrefix);
    (0, predictive_bidding_routes_1.setupPredictiveBiddingRoutes)(app, algorithmsPrefix);
    (0, ai_optimization_routes_1.setupAIOptimizationRoutes)(app, algorithmsPrefix);
}
//# sourceMappingURL=index.js.map