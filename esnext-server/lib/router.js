"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = void 0;
const find_my_way_1 = __importDefault(require("find-my-way"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const watcher_1 = require("./watcher");
function createRouter(options) {
    const watcher = watcher_1.useWatcher(options);
    const router = find_my_way_1.default({
        onBadUrl(path, req, res) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBRWhDLHVDQUFxQztBQUVyQyxTQUFnQixZQUFZLENBQXlDLE9BQXNCO0lBRXZGLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFcEMsTUFBTSxNQUFNLEdBQUcscUJBQU0sQ0FBSTtRQUNyQixRQUFRLENBQUMsSUFBVyxFQUFFLEdBQVcsRUFBRSxHQUFXO1lBQzFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELEdBQUcsT0FBTyxDQUFDLE1BQU07S0FDUCxDQUFDLENBQUM7SUFFaEIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRS9FLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNmLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBRyxvQkFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RELDJGQUEyRjtZQUMzRixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzNDO0tBQ0o7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBdkJELG9DQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSb3V0ZXIsIHtDb25maWcsIEhUVFBWZXJzaW9uLCBSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XHJcbmltcG9ydCBTZXJ2ZXIgZnJvbSBcImh0dHAtcHJveHlcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VXYXRjaGVyfSBmcm9tIFwiLi93YXRjaGVyXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm91dGVyPFYgZXh0ZW5kcyBIVFRQVmVyc2lvbiA9IEhUVFBWZXJzaW9uLlYxPihvcHRpb25zOiBFU05leHRPcHRpb25zKSB7XHJcblxyXG4gICAgY29uc3Qgd2F0Y2hlciA9IHVzZVdhdGNoZXIob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3Qgcm91dGVyID0gUm91dGVyPFY+KHtcclxuICAgICAgICBvbkJhZFVybChwYXRoOnN0cmluZywgcmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKGBNYWxmb3JtZWQgVVJMOiAke3BhdGh9YCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAuLi5vcHRpb25zLnJvdXRlclxyXG4gICAgfSBhcyBDb25maWc8Vj4pO1xyXG5cclxuICAgIG9wdGlvbnMubWlkZGxld2FyZS5mb3JFYWNoKG1pZGRsZXdhcmUgPT4gbWlkZGxld2FyZShyb3V0ZXIsIG9wdGlvbnMsIHdhdGNoZXIpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5wcm94eSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgW3BhdGgsIHNlcnZlck9wdGlvbnNdIG9mIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMucHJveHkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3h5ID0gU2VydmVyLmNyZWF0ZVByb3h5U2VydmVyKHNlcnZlck9wdGlvbnMpO1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIE5vdGUgdGhhdCB0aGlzIGlzIGEgcHJvYmxlbSBiZWNhdXNlIEhUVFAtUFJPWFkgZG9lc24ndCBzdXBwb3J0IEhUVFAyIGhlYWRlcnMhXHJcbiAgICAgICAgICAgIHJvdXRlci5hbGwocGF0aCwgcHJveHkud2ViLmJpbmQocHJveHkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJvdXRlcjtcclxufVxyXG4iXX0=