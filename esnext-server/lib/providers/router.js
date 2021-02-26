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
    const { bundleWebModule } = esnext_web_modules_1.useWebModules(options);
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
                    return bundleWebModule(pathname.substring(13)).then(() => fs_1.promises.stat(filename));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUFpRDtBQUNqRCxxREFBa0Q7QUFDbEQsMkJBQWtDO0FBQ2xDLDBFQUEyQztBQUMzQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXNCO0lBRTVDLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU0sRUFDRixPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUN2QixLQUFLLEdBQUcsRUFBRSxFQUNiLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0lBRTFCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBUTtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksT0FBTyxLQUFLLGNBQWMsRUFBRTtnQkFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDbkU7aUJBQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDO2FBQ25HO2lCQUFN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QUFRLEdBQUcsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxZQUFZLENBQUMsQ0FBQzthQUM5RDtZQUFDLE9BQU8sT0FBTyxFQUFFO2dCQUNkLFFBQVEsR0FBRyxjQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxNQUFNLEVBQUMsSUFBSSxFQUFFLDJCQUFVLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxFQUFDLENBQUM7U0FDaEY7YUFBTTtZQUNILE9BQU87Z0JBQ0gsUUFBUTtnQkFDUixLQUFLO2dCQUNMLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLE9BQU8sRUFBRTtvQkFDTCxjQUFjLEVBQUUsd0JBQVcsQ0FBQyxRQUFRLENBQUM7b0JBQ3JDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJO29CQUM1QixlQUFlLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7b0JBQzFDLGVBQWUsRUFBRSxLQUFLLEtBQUssY0FBYyxJQUFJLEtBQUssS0FBSyxlQUFlLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxVQUFVO2lCQUMzSDtnQkFDRCxLQUFLLEVBQUUsNEJBQVE7YUFDbEIsQ0FBQztTQUNMO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUM7QUF4RkQsOEJBd0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xyXG5pbXBvcnQge3VzZVdlYk1vZHVsZXN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQge3Byb21pc2VzIGFzIGZzfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcclxuaW1wb3J0IHtOT19MSU5LUywgUmVzb3VyY2V9IGZyb20gXCIuL3Jlc291cmNlLXByb3ZpZGVyXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlUm91dGVyKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpIHtcclxuXHJcbiAgICBjb25zdCB7YnVuZGxlV2ViTW9kdWxlfSA9IHVzZVdlYk1vZHVsZXMob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3Qge1xyXG4gICAgICAgIHJvb3REaXIgPSBwcm9jZXNzLmN3ZCgpLFxyXG4gICAgICAgIG1vdW50ID0ge31cclxuICAgIH0gPSBvcHRpb25zO1xyXG5cclxuICAgIGNvbnN0IHJlZ0V4cCA9IC9cXC9bXi8/XSsvO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJlc29sdmUocGF0aG5hbWUpIHtcclxuICAgICAgICBjb25zdCBtYXRjaCA9IHJlZ0V4cC5leGVjKHBhdGhuYW1lKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VnbWVudCA9IG1hdGNoWzBdO1xyXG4gICAgICAgICAgICBpZiAoc2VnbWVudCA9PT0gXCIvd2ViX21vZHVsZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlZ21lbnQgPT09IFwiL3dvcmtzcGFjZXNcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZS5zdWJzdHJpbmcoXCIvd29ya3NwYWNlc1wiLmxlbmd0aCkpfTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtb3VudFtzZWdtZW50XSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihtb3VudFtzZWdtZW50XSwgcGF0aG5hbWUuc3Vic3RyaW5nKHNlZ21lbnQubGVuZ3RoKSl9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7cm91dGU6IFwiL1wiLCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lKX07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gcm91dGUodXJsOiBzdHJpbmcpOiBQcm9taXNlPFJlc291cmNlPiB7XHJcblxyXG4gICAgICAgIGxldCB7cGF0aG5hbWUsIHF1ZXJ5fSA9IHBhcnNlVVJMKHVybCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGlmIChwYXRobmFtZS5lbmRzV2l0aChcInNzLmpzXCIpIC8qIHRyeSBhbmQgc3VwcG9ydCBvcGVud2Mgc3R5bGUgZm9yIG1vZHVsZSBuYW1lcyAqLykge1xyXG4gICAgICAgICAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCIuc2Nzcy5qc1wiKSB8fCBwYXRobmFtZS5lbmRzV2l0aChcIi5zYXNzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLmNzcy5qc1wiKSkge1xyXG4gICAgICAgICAgICAgICAgcGF0aG5hbWUgPSBwYXRobmFtZS5zbGljZSgwLCAtMyk7XHJcbiAgICAgICAgICAgICAgICBxdWVyeS50eXBlID0gXCJtb2R1bGVcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qge3JvdXRlLCBmaWxlbmFtZX0gPSBhd2FpdCByZXNvbHZlKHBhdGhuYW1lKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KGZpbGVuYW1lKS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocm91dGUgPT09IFwiL3dlYl9tb2R1bGVzXCIgJiYgIWZpbGVuYW1lLmVuZHNXaXRoKFwiLm1hcFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwibGF6eSBsb2FkaW5nOlwiLCBjaGFsay5tYWdlbnRhKGZpbGVuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1bmRsZVdlYk1vZHVsZShwYXRobmFtZS5zdWJzdHJpbmcoMTMpKS50aGVuKCgpID0+IGZzLnN0YXQoZmlsZW5hbWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IFwiL3Jlc291cmNlcy9qYXZhc2NyaXB0LnBuZ1wifX07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLk5PVF9GT1VORCwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SLCBtZXNzYWdlOiBlcnJvci5zdGFja307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgbGV0IGxvY2F0aW9uO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qge2hvbWV9ID0gcmVxdWlyZShwYXRoLnJlc29sdmUoZmlsZW5hbWUsIFwicGFja2FnZS5qc29uXCIpKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBob21lIHx8IFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIFwiaW5kZXguaHRtbFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IGxvY2F0aW9ufX07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxyXG4gICAgICAgICAgICAgICAgcXVlcnksXHJcbiAgICAgICAgICAgICAgICBmaWxlbmFtZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZShmaWxlbmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBzdGF0cy5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibGFzdC1tb2RpZmllZFwiOiBzdGF0cy5tdGltZS50b1VUQ1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiByb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiB8fCByb3V0ZSA9PT0gXCIvbm9kZV9tb2R1bGVzXCIgPyBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCIgOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsaW5rczogTk9fTElOS1NcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByb3V0ZVxyXG4gICAgfTtcclxufVxyXG4iXX0=