"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const find_my_way_1 = __importDefault(require("find-my-way"));
const http_proxy_1 = __importDefault(require("http-proxy"));
function createRouter(options, watcher) {
    const router = find_my_way_1.default({
        onBadUrl: (path, req, res) => {
            res.statusCode = 400;
            res.end(`Malformed URL: ${path}`);
        },
        ...options.router
    });
    options.middleware.forEach(middleware => middleware(router, options, watcher));
    if (options.proxy) {
        for (const [path, serverOptions] of Object.entries(options.proxy)) {
            const proxy = http_proxy_1.default.createProxyServer(serverOptions);
            // @ts-ignore Note that this is a problem because HTTP-PROXY doesn't support HTTP2 headers!
            router.all(path, proxy.web.bind(proxy));
        }
    }
    return router;
}
exports.createRouter = createRouter;
//# sourceMappingURL=router.js.map