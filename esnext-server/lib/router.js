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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBR2hDLFNBQWdCLFlBQVksQ0FBeUMsT0FBc0IsRUFBRSxPQUFPO0lBRWhHLE1BQU0sTUFBTSxHQUFHLHFCQUFNLENBQUk7UUFDckIsUUFBUSxDQUFDLElBQVcsRUFBRSxHQUFXLEVBQUUsR0FBVztZQUMxQyxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztZQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxHQUFHLE9BQU8sQ0FBQyxNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRWhCLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUvRSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDZixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDL0QsTUFBTSxLQUFLLEdBQUcsb0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0RCwyRkFBMkY7WUFDM0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMzQztLQUNKO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQXJCRCxvQ0FxQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUm91dGVyLCB7Q29uZmlnLCBIVFRQVmVyc2lvbiwgUmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xuaW1wb3J0IFNlcnZlciBmcm9tIFwiaHR0cC1wcm94eVwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlcjxWIGV4dGVuZHMgSFRUUFZlcnNpb24gPSBIVFRQVmVyc2lvbi5WMT4ob3B0aW9uczogRVNOZXh0T3B0aW9ucywgd2F0Y2hlcikge1xuXG4gICAgY29uc3Qgcm91dGVyID0gUm91dGVyPFY+KHtcbiAgICAgICAgb25CYWRVcmwocGF0aDpzdHJpbmcsIHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuZW5kKGBNYWxmb3JtZWQgVVJMOiAke3BhdGh9YCk7XG4gICAgICAgIH0sXG4gICAgICAgIC4uLm9wdGlvbnMucm91dGVyXG4gICAgfSBhcyBDb25maWc8Vj4pO1xuXG4gICAgb3B0aW9ucy5taWRkbGV3YXJlLmZvckVhY2gobWlkZGxld2FyZSA9PiBtaWRkbGV3YXJlKHJvdXRlciwgb3B0aW9ucywgd2F0Y2hlcikpO1xuXG4gICAgaWYgKG9wdGlvbnMucHJveHkpIHtcbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgc2VydmVyT3B0aW9uc10gb2YgT2JqZWN0LmVudHJpZXMob3B0aW9ucy5wcm94eSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3h5ID0gU2VydmVyLmNyZWF0ZVByb3h5U2VydmVyKHNlcnZlck9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBOb3RlIHRoYXQgdGhpcyBpcyBhIHByb2JsZW0gYmVjYXVzZSBIVFRQLVBST1hZIGRvZXNuJ3Qgc3VwcG9ydCBIVFRQMiBoZWFkZXJzIVxuICAgICAgICAgICAgcm91dGVyLmFsbChwYXRoLCBwcm94eS53ZWIuYmluZChwcm94eSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvdXRlcjtcbn1cbiJdfQ==