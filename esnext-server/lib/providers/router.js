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
                    "cache-control": route === "/web_modules" || route === "/node_modules" || route.startsWith("/esnext-") ? "public, max-age=86400, immutable" : "no-cache"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yb3V0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQTBCO0FBQzFCLDJEQUFpRDtBQUNqRCxxREFBa0Q7QUFDbEQsMkJBQWtDO0FBQ2xDLDBFQUEyQztBQUMzQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLG1EQUErQztBQUMvQywyREFBdUQ7QUFFdkQsU0FBZ0IsU0FBUyxDQUFDLE9BQXNCO0lBRTVDLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyxrQ0FBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpELE1BQU0sRUFDRixPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUN2QixLQUFLLEdBQUcsRUFBRSxFQUNiLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0lBRTFCLEtBQUssVUFBVSxPQUFPLENBQUMsUUFBUTtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksT0FBTyxLQUFLLGNBQWMsRUFBRTtnQkFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDbkU7aUJBQU0sSUFBSSxPQUFPLEtBQUssYUFBYSxFQUFFO2dCQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDO2FBQ25HO2lCQUFN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QUFRLEdBQUcsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxZQUFZLENBQUMsQ0FBQzthQUM5RDtZQUFDLE9BQU8sT0FBTyxFQUFFO2dCQUNkLFFBQVEsR0FBRyxjQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDdEQ7WUFDRCxNQUFNLEVBQUMsSUFBSSxFQUFFLDJCQUFVLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxFQUFDLENBQUM7U0FDaEY7YUFBTTtZQUNILE9BQU87Z0JBQ0gsUUFBUTtnQkFDUixLQUFLO2dCQUNMLFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BDLE9BQU8sRUFBRTtvQkFDTCxjQUFjLEVBQUUsd0JBQVcsQ0FBQyxRQUFRLENBQUM7b0JBQ3JDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJO29CQUM1QixlQUFlLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7b0JBQzFDLGVBQWUsRUFBRSxLQUFLLEtBQUssY0FBYyxJQUFJLEtBQUssS0FBSyxlQUFlLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLFVBQVU7aUJBQzNKO2dCQUNELEtBQUssRUFBRSw0QkFBUTthQUNsQixDQUFDO1NBQ0w7SUFDTCxDQUFDO0lBRUQsT0FBTztRQUNILEtBQUs7S0FDUixDQUFDO0FBQ04sQ0FBQztBQXhGRCw4QkF3RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCB7dXNlV2ViTW9kdWxlc30gZnJvbSBcImVzbmV4dC13ZWItbW9kdWxlc1wiO1xyXG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XHJcbmltcG9ydCB7cHJvbWlzZXMgYXMgZnN9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtjb250ZW50VHlwZX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge05PX0xJTktTLCBSZXNvdXJjZX0gZnJvbSBcIi4vcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VSb3V0ZXIob3B0aW9uczogRVNOZXh0T3B0aW9ucykge1xyXG5cclxuICAgIGNvbnN0IHtidW5kbGVXZWJNb2R1bGV9ID0gdXNlV2ViTW9kdWxlcyhvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCB7XHJcbiAgICAgICAgcm9vdERpciA9IHByb2Nlc3MuY3dkKCksXHJcbiAgICAgICAgbW91bnQgPSB7fVxyXG4gICAgfSA9IG9wdGlvbnM7XHJcblxyXG4gICAgY29uc3QgcmVnRXhwID0gL1xcL1teLz9dKy87XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZShwYXRobmFtZSkge1xyXG4gICAgICAgIGNvbnN0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aG5hbWUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBjb25zdCBzZWdtZW50ID0gbWF0Y2hbMF07XHJcbiAgICAgICAgICAgIGlmIChzZWdtZW50ID09PSBcIi93ZWJfbW9kdWxlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lKX07XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VnbWVudCA9PT0gXCIvd29ya3NwYWNlc1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKHJvb3REaXIsIHBhdGhuYW1lLnN1YnN0cmluZyhcIi93b3Jrc3BhY2VzXCIubGVuZ3RoKSl9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1vdW50W3NlZ21lbnRdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge3JvdXRlOiBzZWdtZW50LCBmaWxlbmFtZTogcGF0aC5qb2luKG1vdW50W3NlZ21lbnRdLCBwYXRobmFtZS5zdWJzdHJpbmcoc2VnbWVudC5sZW5ndGgpKX07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtyb3V0ZTogXCIvXCIsIGZpbGVuYW1lOiBwYXRoLmpvaW4ocm9vdERpciwgcGF0aG5hbWUpfTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiByb3V0ZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuXHJcbiAgICAgICAgbGV0IHtwYXRobmFtZSwgcXVlcnl9ID0gcGFyc2VVUkwodXJsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKHBhdGhuYW1lLmVuZHNXaXRoKFwic3MuanNcIikgLyogdHJ5IGFuZCBzdXBwb3J0IG9wZW53YyBzdHlsZSBmb3IgbW9kdWxlIG5hbWVzICovKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXRobmFtZS5lbmRzV2l0aChcIi5zY3NzLmpzXCIpIHx8IHBhdGhuYW1lLmVuZHNXaXRoKFwiLnNhc3MuanNcIikgfHwgcGF0aG5hbWUuZW5kc1dpdGgoXCIuY3NzLmpzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXRobmFtZSA9IHBhdGhuYW1lLnNsaWNlKDAsIC0zKTtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5LnR5cGUgPSBcIm1vZHVsZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB7cm91dGUsIGZpbGVuYW1lfSA9IGF3YWl0IHJlc29sdmUocGF0aG5hbWUpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQoZmlsZW5hbWUpLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyb3V0ZSA9PT0gXCIvd2ViX21vZHVsZXNcIiAmJiAhZmlsZW5hbWUuZW5kc1dpdGgoXCIubWFwXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJsYXp5IGxvYWRpbmc6XCIsIGNoYWxrLm1hZ2VudGEoZmlsZW5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnVuZGxlV2ViTW9kdWxlKHBhdGhuYW1lLnN1YnN0cmluZygxMykpLnRoZW4oKCkgPT4gZnMuc3RhdChmaWxlbmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycm9yLmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZSA9PT0gXCIvZmF2aWNvbi5pY29cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLlBFUk1BTkVOVF9SRURJUkVDVCwgaGVhZGVyczoge1wibG9jYXRpb25cIjogXCIvcmVzb3VyY2VzL2phdmFzY3JpcHQucG5nXCJ9fTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cge2NvZGU6IEh0dHBTdGF0dXMuTk9UX0ZPVU5ELCBtZXNzYWdlOiBlcnJvci5zdGFja307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyB7Y29kZTogSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1IsIG1lc3NhZ2U6IGVycm9yLnN0YWNrfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgICBsZXQgbG9jYXRpb247XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7aG9tZX0gPSByZXF1aXJlKHBhdGgucmVzb2x2ZShmaWxlbmFtZSwgXCJwYWNrYWdlLmpzb25cIikpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSBwYXRoLnBvc2l4LmpvaW4ocGF0aG5hbWUsIGhvbWUgfHwgXCJpbmRleC5odG1sXCIpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IHBhdGgucG9zaXguam9pbihwYXRobmFtZSwgXCJpbmRleC5odG1sXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRocm93IHtjb2RlOiBIdHRwU3RhdHVzLlBFUk1BTkVOVF9SRURJUkVDVCwgaGVhZGVyczoge1wibG9jYXRpb25cIjogbG9jYXRpb259fTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgcGF0aG5hbWUsXHJcbiAgICAgICAgICAgICAgICBxdWVyeSxcclxuICAgICAgICAgICAgICAgIGZpbGVuYW1lLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogYXdhaXQgZnMucmVhZEZpbGUoZmlsZW5hbWUpLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHN0YXRzLnNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IHN0YXRzLm10aW1lLnRvVVRDU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IHJvdXRlID09PSBcIi93ZWJfbW9kdWxlc1wiIHx8IHJvdXRlID09PSBcIi9ub2RlX21vZHVsZXNcIiB8fCByb3V0ZS5zdGFydHNXaXRoKFwiL2VzbmV4dC1cIikgPyBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCIgOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBsaW5rczogTk9fTElOS1NcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByb3V0ZVxyXG4gICAgfTtcclxufVxyXG4iXX0=