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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUFpRDtBQUNqRCxxREFBa0Q7QUFDbEQsMkJBQWtDO0FBQ2xDLDBFQUEyQztBQUMzQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXNCO0lBRTVDLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU0sRUFDRixPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUN2QixLQUFLLEdBQUcsRUFBRSxFQUNiLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0lBRTFCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBUTtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksT0FBTyxLQUFLLGNBQWMsRUFBRTtnQkFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDbkU7aUJBQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDO2FBQ25HO2lCQUFN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QUFRLEdBQUcsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxZQUFZLENBQUMsQ0FBQzthQUM5RDtZQUFDLE9BQU8sT0FBTyxFQUFFO2dCQUNkLFFBQVEsR0FBRyxjQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxNQUFNLEVBQUMsSUFBSSxFQUFFLDJCQUFVLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxFQUFDLENBQUM7U0FDaEY7YUFBTTtZQUNILE9BQU87Z0JBQ0gsUUFBUTtnQkFDUixLQUFLO2dCQUNMLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLE9BQU8sRUFBRTtvQkFDTCxjQUFjLEVBQUUsd0JBQVcsQ0FBQyxRQUFRLENBQUM7b0JBQ3JDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJO29CQUM1QixlQUFlLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7b0JBQzFDLGVBQWUsRUFBRSxLQUFLLEtBQUssY0FBYyxJQUFJLEtBQUssS0FBSyxlQUFlLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxVQUFVO2lCQUMzSDtnQkFDRCxLQUFLLEVBQUUsNEJBQVE7YUFDbEIsQ0FBQztTQUNMO0lBQ0wsQ0FBQztJQUVELE9BQU87UUFDSCxLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUM7QUF4RkQsOEJBd0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xuaW1wb3J0IHt1c2VXZWJNb2R1bGVzfSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XG5pbXBvcnQge3Byb21pc2VzIGFzIGZzfSBmcm9tIFwiZnNcIjtcbmltcG9ydCBIdHRwU3RhdHVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtjb250ZW50VHlwZX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHtOT19MSU5LUywgUmVzb3VyY2V9IGZyb20gXCIuL3Jlc291cmNlLXByb3ZpZGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VSb3V0ZXIob3B0aW9uczogRVNOZXh0T3B0aW9ucykge1xuXG4gICAgY29uc3Qge2J1bmRsZVdlYk1vZHVsZX0gPSB1c2VXZWJNb2R1bGVzKG9wdGlvbnMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgICByb290RGlyID0gcHJvY2Vzcy5jd2QoKSxcbiAgICAgICAgbW91bnQgPSB7fVxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgY29uc3QgcmVnRXhwID0gL1xcL1teLz9dKy87XG5cbiAgICBhc3luYyBmdW5jdGlvbiByZXNvbHZlKHBhdGhuYW1lKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aG5hbWUpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlZ21lbnQgPSBtYXRjaFswXTtcbiAgICAgICAgICAgIGlmIChzZWdtZW50ID09PSBcIi93ZWJfbW9kdWxlc1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtyb3V0ZTogc2VnbWVudCwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWdtZW50ID09PSBcIi93b3Jrc3BhY2VzXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lLnN1YnN0cmluZyhcIi93b3Jrc3BhY2VzXCIubGVuZ3RoKSl9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChtb3VudFtzZWdtZW50XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7cm91dGU6IHNlZ21lbnQsIGZpbGVuYW1lOiBwYXRoLmpvaW4obW91bnRbc2VnbWVudF0sIHBhdGhuYW1lLnN1YnN0cmluZyhzZWdtZW50Lmxlbmd0aCkpfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3JvdXRlOiBcIi9cIiwgZmlsZW5hbWU6IHBhdGguam9pbihyb290RGlyLCBwYXRobmFtZSl9O1xuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHJvdXRlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xuXG4gICAgICAgIGxldCB7cGF0aG5hbWUsIHF1ZXJ5fSA9IHBhcnNlVVJMKHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKFwic3MuanNcIikgLyogdHJ5IGFuZCBzdXBwb3J0IG9wZW53YyBzdHlsZSBmb3IgbW9kdWxlIG5hbWVzICovKSB7XG4gICAgICAgICAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCIuc2Nzcy5qc1wiKSB8fCBwYXRobmFtZS5lbmRzV2l0aChcIi5zYXNzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLmNzcy5qc1wiKSkge1xuICAgICAgICAgICAgICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuc2xpY2UoMCwgLTMpO1xuICAgICAgICAgICAgICAgIHF1ZXJ5LnR5cGUgPSBcIm1vZHVsZVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge3JvdXRlLCBmaWxlbmFtZX0gPSBhd2FpdCByZXNvbHZlKHBhdGhuYW1lKTtcblxuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQoZmlsZW5hbWUpLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSBcIkVOT0VOVFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJvdXRlID09PSBcIi93ZWJfbW9kdWxlc1wiICYmICFmaWxlbmFtZS5lbmRzV2l0aChcIi5tYXBcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJsYXp5IGxvYWRpbmc6XCIsIGNoYWxrLm1hZ2VudGEoZmlsZW5hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJ1bmRsZVdlYk1vZHVsZShwYXRobmFtZS5zdWJzdHJpbmcoMTMpKS50aGVuKCgpID0+IGZzLnN0YXQoZmlsZW5hbWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUgPT09IFwiL2Zhdmljb24uaWNvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuUEVSTUFORU5UX1JFRElSRUNULCBoZWFkZXJzOiB7XCJsb2NhdGlvblwiOiBcIi9yZXNvdXJjZXMvamF2YXNjcmlwdC5wbmdcIn19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLk5PVF9GT1VORCwgbWVzc2FnZTogZXJyb3Iuc3RhY2t9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SLCBtZXNzYWdlOiBlcnJvci5zdGFja307XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBsZXQgbG9jYXRpb247XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHtob21lfSA9IHJlcXVpcmUocGF0aC5yZXNvbHZlKGZpbGVuYW1lLCBcInBhY2thZ2UuanNvblwiKSk7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIGhvbWUgfHwgXCJpbmRleC5odG1sXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGF0aC5wb3NpeC5qb2luKHBhdGhuYW1lLCBcImluZGV4Lmh0bWxcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5QRVJNQU5FTlRfUkVESVJFQ1QsIGhlYWRlcnM6IHtcImxvY2F0aW9uXCI6IGxvY2F0aW9ufX07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGhuYW1lLFxuICAgICAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgICAgICAgICBcImxhc3QtbW9kaWZpZWRcIjogc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IHJvdXRlID09PSBcIi93ZWJfbW9kdWxlc1wiIHx8IHJvdXRlID09PSBcIi9ub2RlX21vZHVsZXNcIiA/IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIiA6IFwibm8tY2FjaGVcIlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm91dGVcbiAgICB9O1xufVxuIl19