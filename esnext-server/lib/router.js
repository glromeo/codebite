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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBR2hDLFNBQWdCLFlBQVksQ0FBeUMsT0FBc0IsRUFBRSxPQUFPO0lBRWhHLE1BQU0sTUFBTSxHQUFHLHFCQUFNLENBQUk7UUFDckIsUUFBUSxDQUFDLElBQVcsRUFBRSxHQUFXLEVBQUUsR0FBVztZQUMxQyxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztZQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxHQUFHLE9BQU8sQ0FBQyxNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRWhCLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUvRSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDZixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDL0QsTUFBTSxLQUFLLEdBQUcsb0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0RCwyRkFBMkY7WUFDM0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMzQztLQUNKO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQXJCRCxvQ0FxQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUm91dGVyLCB7Q29uZmlnLCBIVFRQVmVyc2lvbiwgUmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm91dGVyPFYgZXh0ZW5kcyBIVFRQVmVyc2lvbiA9IEhUVFBWZXJzaW9uLlYxPihvcHRpb25zOiBFU05leHRPcHRpb25zLCB3YXRjaGVyKSB7XHJcblxyXG4gICAgY29uc3Qgcm91dGVyID0gUm91dGVyPFY+KHtcclxuICAgICAgICBvbkJhZFVybChwYXRoOnN0cmluZywgcmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xyXG4gICAgICAgICAgICByZXMuZW5kKGBNYWxmb3JtZWQgVVJMOiAke3BhdGh9YCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAuLi5vcHRpb25zLnJvdXRlclxyXG4gICAgfSBhcyBDb25maWc8Vj4pO1xyXG5cclxuICAgIG9wdGlvbnMubWlkZGxld2FyZS5mb3JFYWNoKG1pZGRsZXdhcmUgPT4gbWlkZGxld2FyZShyb3V0ZXIsIG9wdGlvbnMsIHdhdGNoZXIpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5wcm94eSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgW3BhdGgsIHNlcnZlck9wdGlvbnNdIG9mIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMucHJveHkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3h5ID0gU2VydmVyLmNyZWF0ZVByb3h5U2VydmVyKHNlcnZlck9wdGlvbnMpO1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIE5vdGUgdGhhdCB0aGlzIGlzIGEgcHJvYmxlbSBiZWNhdXNlIEhUVFAtUFJPWFkgZG9lc24ndCBzdXBwb3J0IEhUVFAyIGhlYWRlcnMhXHJcbiAgICAgICAgICAgIHJvdXRlci5hbGwocGF0aCwgcHJveHkud2ViLmJpbmQocHJveHkpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJvdXRlcjtcclxufVxyXG4iXX0=