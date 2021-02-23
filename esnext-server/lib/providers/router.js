"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const esnext_web_modules_1 = require("esnext-web-modules");
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const mime_types_1 = require("../util/mime-types");
const resource_provider_1 = require("./resource-provider");
function useRouter(options) {
    const { esbuildWebModule } = esnext_web_modules_1.useWebModules(options);
    const { rootDir = process.cwd(), mount = {} } = options;
    const regExp = /\/[^/?]+/;
    async function resolve(pathname) {
        const match = regExp.exec(pathname);
        if (match) {
            const segment = match[0];
            if (segment === "/web_modules") {
                return { route: segment, filename: path_1.default.join(rootDir, pathname) };
            }
            else if (segment === "/workspaces") {
                return { route: segment, filename: path_1.default.join(rootDir, pathname.substring("/workspaces".length)) };
            }
            else if (mount[segment]) {
                return { route: segment, filename: path_1.default.join(mount[segment], pathname.substring(segment.length)) };
            }
        }
        return { route: "/", filename: path_1.default.join(rootDir, pathname) };
    }
    async function route(url) {
        let { pathname, query } = fast_url_parser_1.parse(url, true);
        if (pathname.endsWith("ss.js") /* try and support openwc style for module names */) {
            if (pathname.endsWith(".scss.js") || pathname.endsWith(".sass.js") || pathname.endsWith(".css.js")) {
                pathname = pathname.slice(0, -3);
                query.type = "module";
            }
        }
        const { route, filename } = await resolve(pathname);
        const stats = await fs_1.promises.stat(filename).catch(error => {
            if (error.code === "ENOENT") {
                if (route === "/web_modules" && !filename.endsWith(".map")) {
                    tiny_node_logger_1.default.warn("lazy loading:", chalk_1.default.magenta(filename));
                    return esbuildWebModule(pathname.substring(13)).then(() => fs_1.promises.stat(filename));
                }
            }
            throw error;
        }).catch(error => {
            if (error.code === "ENOENT") {
                if (pathname === "/favicon.ico") {
                    throw { code: http_status_codes_1.default.PERMANENT_REDIRECT, headers: { "location": "/resources/javascript.png" } };
                }
                else {
                    throw { code: http_status_codes_1.default.NOT_FOUND, message: error.stack };
                }
            }
            else {
                throw { code: http_status_codes_1.default.INTERNAL_SERVER_ERROR, message: error.stack };
            }
        });
        if (stats.isDirectory()) {
            let location;
            try {
                const { home } = require(path_1.default.resolve(filename, "package.json"));
                location = path_1.default.posix.join(pathname, home || "index.html");
            }
            catch (ignored) {
                location = path_1.default.posix.join(pathname, "index.html");
            }
            throw { code: http_status_codes_1.default.PERMANENT_REDIRECT, headers: { "location": location } };
        }
        else {
            return {
                pathname,
                query,
                filename,
                content: await fs_1.promises.readFile(filename),
                headers: {
                    "content-type": mime_types_1.contentType(filename),
                    "content-length": stats.size,
                    "last-modified": stats.mtime.toUTCString(),
                    "cache-control": route === "/web_modules" || route === "/node_modules" ? "public, max-age=86400, immutable" : "no-cache"
                },
                links: resource_provider_1.NO_LINKS
            };
        }
    }
    return {
        route
    };
}
exports.useRouter = useRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUFpRDtBQUNqRCxxREFBa0Q7QUFDbEQsMkJBQWtDO0FBQ2xDLDBFQUEyQztBQUMzQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXNCO0lBRTVDLE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLGtDQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbEQsTUFBTSxFQUNGLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQ3ZCLEtBQUssR0FBRyxFQUFFLEVBQ2IsR0FBRyxPQUFPLENBQUM7SUFFWixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFFMUIsS0FBSyxVQUFVLE9BQU8sQ0FBQyxRQUFRO1FBQzNCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxLQUFLLEVBQUU7WUFDUCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxPQUFPLEtBQUssY0FBYyxFQUFFO2dCQUM1QixPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUMsQ0FBQzthQUNuRTtpQkFBTSxJQUFJLE9BQU8sS0FBSyxhQUFhLEVBQUU7Z0JBQ2xDLE9BQU8sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUM7YUFDbkc7aUJB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L0QsUUFBUSxHQUFHLGNBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksWUFBWSxDQUFDLENBQUM7YUFDOUQ7WUFBQyxPQUFPLE9BQU8sRUFBRTtnQkFDZCxRQUFRLEdBQUcsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsTUFBTSxFQUFDLElBQUksRUFBRSwyQkFBVSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsRUFBQyxDQUFDO1NBQ2hGO2FBQU07WUFDSCxPQUFPO2dCQUNILFFBQVE7Z0JBQ1IsS0FBSztnQkFDTCxRQUFRO2dCQUNSLE9BQU8sRUFBRSxNQUFNLGFBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO2dCQUNwQyxPQUFPLEVBQUU7b0JBQ0wsY0FBYyxFQUFFLHdCQUFXLENBQUMsUUFBUSxDQUFDO29CQUNyQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSTtvQkFDNUIsZUFBZSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO29CQUMxQyxlQUFlLEVBQUUsS0FBSyxLQUFLLGNBQWMsSUFBSSxLQUFLLEtBQUssZUFBZSxDQUFDLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsVUFBVTtpQkFDM0g7Z0JBQ0QsS0FBSyxFQUFFLDRCQUFRO2FBQ2xCLENBQUM7U0FDTDtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsS0FBSztLQUNSLENBQUM7QUFDTixDQUFDO0FBeEZELDhCQXdGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7Tk9fTElOS1MsIFJlc291cmNlfSBmcm9tIFwiLi9yZXNvdXJjZS1wcm92aWRlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlUm91dGVyKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpIHtcblxuICAgIGNvbnN0IHtlc2J1aWxkV2ViTW9kdWxlfSA9IHVzZVdlYk1vZHVsZXMob3B0aW9ucyk7XG5cbiAgICBjb25zdCB7XG4gICAgICAgIHJvb3REaXIgPSBwcm9jZXNzLmN3ZCgpLFxuICAgICAgICBtb3VudCA9IHt9XG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICBjb25zdCByZWdFeHAgPSAvXFwvW14vP10rLztcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHJlc29sdmUocGF0aG5hbWUpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRobmFtZSk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3Qgc2VnbWVudCA9IG1hdGNoWzBdO1xuICAgICAgICAgICAgaWYgKHNlZ21lbnQgPT09IFwiL3dlYl9tb2R1bGVzXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lKX07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlZ21lbnQgPT09IFwiL3dvcmtzcGFjZXNcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7cm91dGU6IHNlZ21lbnQsIGZpbGVuYW1lOiBwYXRoLmpvaW4ocm9vdERpciwgcGF0aG5hbWUuc3Vic3RyaW5nKFwiL3dvcmtzcGFjZXNcIi5sZW5ndGgpKX07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vdW50W3NlZ21lbnRdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihtb3VudFtzZWdtZW50XSwgcGF0aG5hbWUuc3Vic3RyaW5nKHNlZ21lbnQubGVuZ3RoKSl9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7cm91dGU6IFwiL1wiLCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lKX07XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gcm91dGUodXJsOiBzdHJpbmcpOiBQcm9taXNlPFJlc291cmNlPiB7XG5cbiAgICAgICAgbGV0IHtwYXRobmFtZSwgcXVlcnl9ID0gcGFyc2VVUkwodXJsLCB0cnVlKTtcblxuICAgICAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCJzcy5qc1wiKSAvKiB0cnkgYW5kIHN1cHBvcnQgb3BlbndjIHN0eWxlIGZvciBtb2R1bGUgbmFtZXMgKi8pIHtcbiAgICAgICAgICAgIGlmIChwYXRobmFtZS5lbmRzV2l0aChcIi5zY3NzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLnNhc3MuanNcIikgfHwgcGF0aG5hbWUuZW5kc1dpdGgoXCIuY3NzLmpzXCIpKSB7XG4gICAgICAgICAgICAgICAgcGF0aG5hbWUgPSBwYXRobmFtZS5zbGljZSgwLCAtMyk7XG4gICAgICAgICAgICAgICAgcXVlcnkudHlwZSA9IFwibW9kdWxlXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7cm91dGUsIGZpbGVuYW1lfSA9IGF3YWl0IHJlc29sdmUocGF0aG5hbWUpO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChmaWxlbmFtZSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocm91dGUgPT09IFwiL3dlYl9tb2R1bGVzXCIgJiYgIWZpbGVuYW1lLmVuZHNXaXRoKFwiLm1hcFwiKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcImxhenkgbG9hZGluZzpcIiwgY2hhbGsubWFnZW50YShmaWxlbmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNidWlsZFdlYk1vZHVsZShwYXRobmFtZS5zdWJzdHJpbmcoMTMpKS50aGVuKCgpID0+IGZzLnN0YXQoZmlsZW5hbWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuUEVSTUFORU5UX1JFRElSRUNULCBoZWFkZXJzOiB7XCJsb2NhdGlvblwiOiBcIi9yZXNvdXJjZXMvamF2YXNjcmlwdC5wbmdcIn19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLk5PVF9GT1VORCwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SLCBtZXNzYWdlOiBlcnJvci5zdGFja307XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBsZXQgbG9jYXRpb247XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHtob21lfSA9IHJlcXVpcmUocGF0aC5yZXNvbHZlKGZpbGVuYW1lLCBcInBhY2thZ2UuanNvblwiKSk7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIGhvbWUgfHwgXCJpbmRleC5odG1sXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBcImluZGV4Lmh0bWxcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IGxvY2F0aW9ufX07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxuICAgICAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgICAgICAgICBcImxhc3QtbW9kaWZpZWRcIjogc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IHJvdXRlID09PSBcIi93ZWJfbW9kdWxlc1wiIHx8IHJvdXRlID09PSBcIi9ub2RlX21vZHVsZXNcIiA/IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIiA6IFwibm8tY2FjaGVcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm91dGVcbiAgICB9O1xufVxuIl19