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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBRWhDLHVDQUFxQztBQUVyQyxTQUFnQixZQUFZLENBQXlDLE9BQXNCO0lBRXZGLE1BQU0sT0FBTyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFcEMsTUFBTSxNQUFNLEdBQUcscUJBQU0sQ0FBSTtRQUNyQixRQUFRLENBQUMsSUFBVyxFQUFFLEdBQVcsRUFBRSxHQUFXO1lBQzFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELEdBQUcsT0FBTyxDQUFDLE1BQU07S0FDUCxDQUFDLENBQUM7SUFFaEIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRS9FLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNmLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBRyxvQkFBTSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RELDJGQUEyRjtZQUMzRixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzNDO0tBQ0o7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBdkJELG9DQXVCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSb3V0ZXIsIHtDb25maWcsIEhUVFBWZXJzaW9uLCBSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHt1c2VXYXRjaGVyfSBmcm9tIFwiLi93YXRjaGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb3V0ZXI8ViBleHRlbmRzIEhUVFBWZXJzaW9uID0gSFRUUFZlcnNpb24uVjE+KG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpIHtcblxuICAgIGNvbnN0IHdhdGNoZXIgPSB1c2VXYXRjaGVyKG9wdGlvbnMpO1xuXG4gICAgY29uc3Qgcm91dGVyID0gUm91dGVyPFY+KHtcbiAgICAgICAgb25CYWRVcmwocGF0aDpzdHJpbmcsIHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDA7XG4gICAgICAgICAgICByZXMuZW5kKGBNYWxmb3JtZWQgVVJMOiAke3BhdGh9YCk7XG4gICAgICAgIH0sXG4gICAgICAgIC4uLm9wdGlvbnMucm91dGVyXG4gICAgfSBhcyBDb25maWc8Vj4pO1xuXG4gICAgb3B0aW9ucy5taWRkbGV3YXJlLmZvckVhY2gobWlkZGxld2FyZSA9PiBtaWRkbGV3YXJlKHJvdXRlciwgb3B0aW9ucywgd2F0Y2hlcikpO1xuXG4gICAgaWYgKG9wdGlvbnMucHJveHkpIHtcbiAgICAgICAgZm9yIChjb25zdCBbcGF0aCwgc2VydmVyT3B0aW9uc10gb2YgT2JqZWN0LmVudHJpZXMob3B0aW9ucy5wcm94eSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3h5ID0gU2VydmVyLmNyZWF0ZVByb3h5U2VydmVyKHNlcnZlck9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBOb3RlIHRoYXQgdGhpcyBpcyBhIHByb2JsZW0gYmVjYXVzZSBIVFRQLVBST1hZIGRvZXNuJ3Qgc3VwcG9ydCBIVFRQMiBoZWFkZXJzIVxuICAgICAgICAgICAgcm91dGVyLmFsbChwYXRoLCBwcm94eS53ZWIuYmluZChwcm94eSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvdXRlcjtcbn1cbiJdfQ==