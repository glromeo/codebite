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
    const watcher = (0, watcher_1.useWatcher)(options);
    const router = (0, find_my_way_1.default)({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4REFBa0U7QUFDbEUsNERBQWdDO0FBRWhDLHVDQUFxQztBQUVyQyxTQUFnQixZQUFZLENBQXlDLE9BQXNCO0lBRXZGLE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUVwQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFNLEVBQUk7UUFDckIsUUFBUSxDQUFDLElBQVcsRUFBRSxHQUFXLEVBQUUsR0FBVztZQUMxQyxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztZQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxHQUFHLE9BQU8sQ0FBQyxNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRWhCLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUvRSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDZixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDL0QsTUFBTSxLQUFLLEdBQUcsb0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0RCwyRkFBMkY7WUFDM0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMzQztLQUNKO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQXZCRCxvQ0F1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUm91dGVyLCB7Q29uZmlnLCBIVFRQVmVyc2lvbiwgUmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4vd2F0Y2hlclwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlcjxWIGV4dGVuZHMgSFRUUFZlcnNpb24gPSBIVFRQVmVyc2lvbi5WMT4ob3B0aW9uczogRVNOZXh0T3B0aW9ucykge1xyXG5cclxuICAgIGNvbnN0IHdhdGNoZXIgPSB1c2VXYXRjaGVyKG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnN0IHJvdXRlciA9IFJvdXRlcjxWPih7XHJcbiAgICAgICAgb25CYWRVcmwocGF0aDpzdHJpbmcsIHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMDtcclxuICAgICAgICAgICAgcmVzLmVuZChgTWFsZm9ybWVkIFVSTDogJHtwYXRofWApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLi4ub3B0aW9ucy5yb3V0ZXJcclxuICAgIH0gYXMgQ29uZmlnPFY+KTtcclxuXHJcbiAgICBvcHRpb25zLm1pZGRsZXdhcmUuZm9yRWFjaChtaWRkbGV3YXJlID0+IG1pZGRsZXdhcmUocm91dGVyLCBvcHRpb25zLCB3YXRjaGVyKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMucHJveHkpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IFtwYXRoLCBzZXJ2ZXJPcHRpb25zXSBvZiBPYmplY3QuZW50cmllcyhvcHRpb25zLnByb3h5KSkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm94eSA9IFNlcnZlci5jcmVhdGVQcm94eVNlcnZlcihzZXJ2ZXJPcHRpb25zKTtcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBOb3RlIHRoYXQgdGhpcyBpcyBhIHByb2JsZW0gYmVjYXVzZSBIVFRQLVBST1hZIGRvZXNuJ3Qgc3VwcG9ydCBIVFRQMiBoZWFkZXJzIVxyXG4gICAgICAgICAgICByb3V0ZXIuYWxsKHBhdGgsIHByb3h5LndlYi5iaW5kKHByb3h5KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByb3V0ZXI7XHJcbn1cclxuIl19