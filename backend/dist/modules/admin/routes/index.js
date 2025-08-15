"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdminRoutes = setupAdminRoutes;
const organizations_routes_1 = require("./organizations.routes");
const users_routes_1 = require("./users.routes");
const canonical_routes_1 = require("./canonical.routes");
const api_keys_routes_1 = require("./api-keys.routes");
function setupAdminRoutes(app, apiPrefix) {
    const adminPrefix = `${apiPrefix}/admin`;
    (0, organizations_routes_1.setupOrganizationRoutes)(app, adminPrefix);
    (0, users_routes_1.setupUserRoutes)(app, adminPrefix);
    (0, canonical_routes_1.setupCanonicalRoutes)(app, adminPrefix);
    (0, api_keys_routes_1.setupAPIKeyRoutes)(app, adminPrefix);
}
exports.default = setupAdminRoutes;
//# sourceMappingURL=index.js.map