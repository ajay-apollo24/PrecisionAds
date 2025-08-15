"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdServingRoutes = setupAdServingRoutes;
const ad_serving_routes_1 = require("./ad-serving.routes");
function setupAdServingRoutes(app, apiPrefix) {
    const adServingPrefix = `${apiPrefix}/ad-serving`;
    (0, ad_serving_routes_1.setupAdServingRoutes)(app, adServingPrefix);
}
//# sourceMappingURL=index.js.map