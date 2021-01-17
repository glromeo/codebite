"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebModulesPlugin = exports.parsePathname = exports.toPosix = exports.bareNodeModule = exports.isBare = void 0;
__exportStar(require("./esbuild-web-modules"), exports);
var es_import_utils_1 = require("./es-import-utils");
Object.defineProperty(exports, "isBare", { enumerable: true, get: function () { return es_import_utils_1.isBare; } });
Object.defineProperty(exports, "bareNodeModule", { enumerable: true, get: function () { return es_import_utils_1.bareNodeModule; } });
Object.defineProperty(exports, "toPosix", { enumerable: true, get: function () { return es_import_utils_1.toPosix; } });
Object.defineProperty(exports, "parsePathname", { enumerable: true, get: function () { return es_import_utils_1.parsePathname; } });
var babel_plugin_web_modules_1 = require("./babel-plugin-web-modules");
Object.defineProperty(exports, "useWebModulesPlugin", { enumerable: true, get: function () { return babel_plugin_web_modules_1.useWebModulesPlugin; } });
//# sourceMappingURL=index.js.map