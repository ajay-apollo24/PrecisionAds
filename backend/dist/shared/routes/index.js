"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSharedRoutes = setupSharedRoutes;
const auth_routes_1 = require("./auth.routes");
function setupSharedRoutes(app, apiPrefix) {
    (0, auth_routes_1.setupAuthRoutes)(app, `${apiPrefix}/auth`);
}
//# sourceMappingURL=index.js.map