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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUFpRDtBQUNqRCxxREFBa0Q7QUFDbEQsMkJBQWtDO0FBQ2xDLDBFQUEyQztBQUMzQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXNCO0lBRTVDLE1BQU0sRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLGtDQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFbEQsTUFBTSxFQUNGLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQ3ZCLEtBQUssR0FBRyxFQUFFLEVBQ2IsR0FBRyxPQUFPLENBQUM7SUFFWixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFFMUIsS0FBSyxVQUFVLE9BQU8sQ0FBQyxRQUFRO1FBQzNCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxLQUFLLEVBQUU7WUFDUCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxPQUFPLEtBQUssY0FBYyxFQUFFO2dCQUM1QixPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUMsQ0FBQzthQUNuRTtpQkFBTSxJQUFJLE9BQU8sS0FBSyxhQUFhLEVBQUU7Z0JBQ2xDLE9BQU8sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUM7YUFDbkc7aUJB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L0QsUUFBUSxHQUFHLGNBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksWUFBWSxDQUFDLENBQUM7YUFDOUQ7WUFBQyxPQUFPLE9BQU8sRUFBRTtnQkFDZCxRQUFRLEdBQUcsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsTUFBTSxFQUFDLElBQUksRUFBRSwyQkFBVSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsRUFBQyxDQUFDO1NBQ2hGO2FBQU07WUFDSCxPQUFPO2dCQUNILFFBQVE7Z0JBQ1IsS0FBSztnQkFDTCxRQUFRO2dCQUNSLE9BQU8sRUFBRSxNQUFNLGFBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO2dCQUNwQyxPQUFPLEVBQUU7b0JBQ0wsY0FBYyxFQUFFLHdCQUFXLENBQUMsUUFBUSxDQUFDO29CQUNyQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSTtvQkFDNUIsZUFBZSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO29CQUMxQyxlQUFlLEVBQUUsS0FBSyxLQUFLLGNBQWMsSUFBSSxLQUFLLEtBQUssZUFBZSxDQUFDLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsVUFBVTtpQkFDM0g7Z0JBQ0QsS0FBSyxFQUFFLDRCQUFRO2FBQ2xCLENBQUM7U0FDTDtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsS0FBSztLQUNSLENBQUM7QUFDTixDQUFDO0FBeEZELDhCQXdGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IHt1c2VXZWJNb2R1bGVzfSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCB7cGFyc2UgYXMgcGFyc2VVUkx9IGZyb20gXCJmYXN0LXVybC1wYXJzZXJcIjtcclxuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCBIdHRwU3RhdHVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7Tk9fTElOS1MsIFJlc291cmNlfSBmcm9tIFwiLi9yZXNvdXJjZS1wcm92aWRlclwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVzZVJvdXRlcihvcHRpb25zOiBFU05leHRPcHRpb25zKSB7XHJcblxyXG4gICAgY29uc3Qge2VzYnVpbGRXZWJNb2R1bGV9ID0gdXNlV2ViTW9kdWxlcyhvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgcm9vdERpciA9IHByb2Nlc3MuY3dkKCksXHJcbiAgICAgICAgbW91bnQgPSB7fVxyXG4gICAgfSA9IG9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgcmVnRXhwID0gL1xcL1teLz9dKy87XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZShwYXRobmFtZSkge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aG5hbWUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25zdCBzZWdtZW50ID0gbWF0Y2hbMF07XHJcbiAgICAgICAgICAgIGlmIChzZWdtZW50ID09PSBcIi93ZWJfbW9kdWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lKX07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VnbWVudCA9PT0gXCIvd29ya3NwYWNlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lLnN1YnN0cmluZyhcIi93b3Jrc3BhY2VzXCIubGVuZ3RoKSl9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vdW50W3NlZ21lbnRdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKG1vdW50W3NlZ21lbnRdLCBwYXRobmFtZS5zdWJzdHJpbmcoc2VnbWVudC5sZW5ndGgpKX07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtyb3V0ZTogXCIvXCIsIGZpbGVuYW1lOiBwYXRoLmpvaW4ocm9vdERpciwgcGF0aG5hbWUpfTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiByb3V0ZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuXHJcbiAgICAgICAgbGV0IHtwYXRobmFtZSwgcXVlcnl9ID0gcGFyc2VVUkwodXJsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKFwic3MuanNcIikgLyogdHJ5IGFuZCBzdXBwb3J0IG9wZW53YyBzdHlsZSBmb3IgbW9kdWxlIG5hbWVzICovKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXRobmFtZS5lbmRzV2l0aChcIi5zY3NzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLnNhc3MuanNcIikgfHwgcGF0aG5hbWUuZW5kc1dpdGgoXCIuY3NzLmpzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnNsaWNlKDAsIC0zKTtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5LnR5cGUgPSBcIm1vZHVsZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7cm91dGUsIGZpbGVuYW1lfSA9IGF3YWl0IHJlc29sdmUocGF0aG5hbWUpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQoZmlsZW5hbWUpLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiAmJiAhZmlsZW5hbWUuZW5kc1dpdGgoXCIubWFwXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJsYXp5IGxvYWRpbmc6XCIsIGNoYWxrLm1hZ2VudGEoZmlsZW5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXNidWlsZFdlYk1vZHVsZShwYXRobmFtZS5zdWJzdHJpbmcoMTMpKS50aGVuKCgpID0+IGZzLnN0YXQoZmlsZW5hbWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IFwiL3Jlc291cmNlcy9qYXZhc2NyaXB0LnBuZ1wifX07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLk5PVF9GT1VORCwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SLCBtZXNzYWdlOiBlcnJvci5zdGFja307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgbGV0IGxvY2F0aW9uO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qge2hvbWV9ID0gcmVxdWlyZShwYXRoLnJlc29sdmUoZmlsZW5hbWUsIFwicGFja2FnZS5qc29uXCIpKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBob21lIHx8IFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IGxvY2F0aW9ufX07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxyXG4gICAgICAgICAgICAgICAgcXVlcnksXHJcbiAgICAgICAgICAgICAgICBmaWxlbmFtZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBzdGF0cy5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibGFzdC1tb2RpZmllZFwiOiBzdGF0cy5tdGltZS50b1VUQ1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiByb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiB8fCByb3V0ZSA9PT0gXCIvbm9kZV9tb2R1bGVzXCIgPyBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCIgOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsaW5rczogTk9fTElOS1NcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByb3V0ZVxyXG4gICAgfTtcclxufVxyXG4iXX0=