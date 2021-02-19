"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = void 0;
const cors_1 = __importDefault(require("cors"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = require("http2");
const path_1 = require("path");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("./providers/resource-provider");
const router_1 = require("./router");
const http2_push_1 = require("./util/http2-push");
const mime_types_1 = require("./util/mime-types");
function createRequestHandler(options, watcher) {
    const { provideResource } = resource_provider_1.useResourceProvider(options, watcher);
    const { http2Push } = http2_push_1.useHttp2Push(options, watcher);
    const router = router_1.createRouter(options, watcher);
    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    router.get("/resources/*", function resourcesMiddleware(req, res) {
        const { pathname } = fast_url_parser_1.parse(req.url);
        const filename = path_1.join(options.resources, pathname.substring(10));
        sendFile(filename, res);
    });
    router.get("/esnext-server/*", function resourcesMiddleware(req, res) {
        const { pathname } = fast_url_parser_1.parse(req.url);
        const filename = require.resolve(path_1.posix.join("esnext-server-client", pathname.substring(14)));
        sendFile(filename, res);
    });
    function sendFile(filename, res) {
        fs_1.readFile(filename, (err, data) => {
            if (err) {
                res.writeHead(http_status_codes_1.default.NOT_FOUND);
                res.end();
            }
            else {
                res.writeHead(http_status_codes_1.default.OK, {
                    "content-type": mime_types_1.contentType(filename),
                    "cache-control": "public, max-age=86400, immutable"
                });
                res.end(data);
            }
        });
    }
    /**
     *  __        __         _                               ____
     *  \ \      / /__  _ __| | _____ _ __   __ _  ___ ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *   \ \ /\ / / _ \| '__| |/ / __| '_ \ / _` |/ __/ _ \ | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *    \ V  V / (_) | |  |   <\__ \ |_) | (_| | (_|  __/ |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *     \_/\_/ \___/|_|  |_|\_\___/ .__/ \__,_|\___\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *                               |_|
     */
    router.get("/*", async function workspaceMiddleware(req, res) {
        if (req.url)
            try {
                const resource = await provideResource(req.url);
                if (resource.links && options.http2 === "preload") {
                    resource.headers.link = resource.links.map(link => {
                        provideResource(link).catch(function () {
                            tiny_node_logger_1.default.warn("failed to pre-warm cache with:", link);
                        });
                        return `<${link}>; crossorigin; rel=preload; as=${link.endsWith(".css") ? "style" : "script"}`;
                    });
                }
                res.writeHead(200, resource.headers);
                if (resource.links && options.http2 === "push" && res instanceof http2_1.Http2ServerResponse) {
                    http2Push(res.stream, resource.pathname, resource.links);
                }
                res.end(resource.content);
            }
            catch (error) {
                const { code, headers = {}, message, stack } = error;
                if (stack) {
                    const code = http_status_codes_1.default.INTERNAL_SERVER_ERROR;
                    const text = http_status_codes_1.default.getStatusText(code);
                    tiny_node_logger_1.default.error `${code} '${text}' handling: ${req.url}`;
                    tiny_node_logger_1.default.error(error);
                    res.writeHead(code, headers);
                    res.end(stack);
                }
                else {
                    const text = http_status_codes_1.default.getStatusText(code);
                    if (code === 308) {
                        // todo: check permanent redirect behaviour
                        tiny_node_logger_1.default.warn `${code} '${text}' ${req.url} -> ${headers.location}`;
                    }
                    else {
                        tiny_node_logger_1.default.error `${code} '${text}' ${message || "handling: " + req.url}`;
                    }
                    res.writeHead(code, headers);
                    res.end(message);
                }
            }
    });
    /**
     *    ____                      ___       _       _         __  __ _     _     _ _
     *   / ___|_ __ ___  ___ ___   / _ \ _ __(_) __ _(_)_ __   |  \/  (_) __| | __| | | _____      ____ _ _ __ ___
     *  | |   | '__/ _ \/ __/ __| | | | | '__| |/ _` | | '_ \  | |\/| | |/ _` |/ _` | |/ _ \ \ /\ / / _` | '__/ _ \
     *  | |___| | | (_) \__ \__ \ | |_| | |  | | (_| | | | | | | |  | | | (_| | (_| | |  __/\ V  V / (_| | | |  __/
     *   \____|_|  \___/|___/___/  \___/|_|  |_|\__, |_|_| |_| |_|  |_|_|\__,_|\__,_|_|\___| \_/\_/ \__,_|_|  \___|
     *                                          |___/
     */
    const cors = cors_1.default(options.cors);
    const next = (req, res) => function (err) {
        if (err) {
            throw err;
        }
        else {
            router.lookup(req, res);
        }
    };
    return function requestHandler(req, res) {
        tiny_node_logger_1.default.debug(req.method, req.url);
        cors(req, res, next(req, res));
    };
}
exports.createRequestHandler = createRequestHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLCtCQUFpQztBQUNqQyx3RUFBbUM7QUFFbkMscUVBQWtFO0FBQ2xFLHFDQUFzQztBQUN0QyxrREFBK0M7QUFDL0Msa0RBQThDO0FBRTlDLFNBQWdCLG9CQUFvQixDQUF1RCxPQUFzQixFQUFFLE9BQWtCO0lBRWpJLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDaEUsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRW5ELE1BQU0sTUFBTSxHQUFHLHFCQUFZLENBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWpEOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUNoRixNQUFNLEVBQUMsUUFBUSxFQUFD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QVc7UUFDbkQsMEJBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQztBQUNOLENBQUM7QUFySEQsb0RBcUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGU1dhdGNoZXJ9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQgUm91dGVyLCB7UmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCB7am9pbiwgcG9zaXh9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtjcmVhdGVSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlcXVlc3RIYW5kbGVyPFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24gPSBSb3V0ZXIuSFRUUFZlcnNpb24uVjE+KG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsIHdhdGNoZXI6IEZTV2F0Y2hlcikge1xyXG5cclxuICAgIGNvbnN0IHtwcm92aWRlUmVzb3VyY2V9ID0gdXNlUmVzb3VyY2VQcm92aWRlcihvcHRpb25zLCB3YXRjaGVyKTtcclxuICAgIGNvbnN0IHtodHRwMlB1c2h9ID0gdXNlSHR0cDJQdXNoKG9wdGlvbnMsIHdhdGNoZXIpO1xyXG5cclxuICAgIGNvbnN0IHJvdXRlciA9IGNyZWF0ZVJvdXRlcjxWPihvcHRpb25zLCB3YXRjaGVyKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgX19fXyAgXyAgICAgICAgXyAgIF8gICAgICAgIF9fX19cclxuICAgICAqICAvIF9fX3x8IHxfIF9fIF98IHxfKF8pIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xyXG4gICAgICogIFxcX19fIFxcfCBfXy8gX2AgfCBfX3wgfC8gX198IHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgX19fKSB8IHx8IChffCB8IHxffCB8IChfXyAgfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICB8X19fXy8gXFxfX1xcX18sX3xcXF9ffF98XFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cclxuICAgICAqXHJcbiAgICAgKi9cclxuICAgIHJvdXRlci5nZXQoXCIvcmVzb3VyY2VzLypcIiwgZnVuY3Rpb24gcmVzb3VyY2VzTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuICAgICAgICBjb25zdCB7cGF0aG5hbWV9ID0gcGFyc2VVUkwocmVxLnVybCk7XHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBqb2luKG9wdGlvbnMucmVzb3VyY2VzLCBwYXRobmFtZS5zdWJzdHJpbmcoMTApKTtcclxuICAgICAgICBzZW5kRmlsZShmaWxlbmFtZSwgcmVzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJvdXRlci5nZXQoXCIvZXNuZXh0LXNlcnZlci8qXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IHBhcnNlVVJMKHJlcS51cmwpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcmVxdWlyZS5yZXNvbHZlKHBvc2l4LmpvaW4oXCJlc25leHQtc2VydmVyLWNsaWVudFwiLCBwYXRobmFtZS5zdWJzdHJpbmcoMTQpKSk7XHJcbiAgICAgICAgc2VuZEZpbGUoZmlsZW5hbWUsIHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZW5kRmlsZTxWPihmaWxlbmFtZTogc3RyaW5nLCByZXM6IFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgPyBTZXJ2ZXJSZXNwb25zZSA6IEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcclxuICAgICAgICByZWFkRmlsZShmaWxlbmFtZSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5PSywge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cclxuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsKSB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZShyZXEudXJsKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5saW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInByZWxvYWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVycy5saW5rID0gcmVzb3VyY2UubGlua3MubWFwKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVSZXNvdXJjZShsaW5rKS5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZmFpbGVkIHRvIHByZS13YXJtIGNhY2hlIHdpdGg6XCIsIGxpbmspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgPCR7bGlua30+OyBjcm9zc29yaWdpbjsgcmVsPXByZWxvYWQ7IGFzPSR7bGluay5lbmRzV2l0aChcIi5jc3NcIikgPyBcInN0eWxlXCIgOiBcInNjcmlwdFwifWA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHJlc291cmNlLmhlYWRlcnMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc291cmNlLmxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHVzaFwiICYmIHJlcyBpbnN0YW5jZW9mIEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCByZXNvdXJjZS5wYXRobmFtZSwgcmVzb3VyY2UubGlua3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMuZW5kKHJlc291cmNlLmNvbnRlbnQpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zdCB7Y29kZSwgaGVhZGVycyA9IHt9LCBtZXNzYWdlLCBzdGFja30gPSBlcnJvcjtcclxuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1I7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3JlcS51cmx9YDtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChzdGFjayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDMwOCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86IGNoZWNrIHBlcm1hbmVudCByZWRpcmVjdCBiZWhhdmlvdXJcclxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybmAke2NvZGV9ICcke3RleHR9JyAke3JlcS51cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgJHttZXNzYWdlIHx8IFwiaGFuZGxpbmc6IFwiICsgcmVxLnVybH1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgIF9fX18gICAgICAgICAgICAgICAgICAgICAgX19fICAgICAgIF8gICAgICAgXyAgICAgICAgIF9fICBfXyBfICAgICBfICAgICBfIF9cclxuICAgICAqICAgLyBfX198XyBfXyBfX18gIF9fXyBfX18gICAvIF8gXFwgXyBfXyhfKSBfXyBfKF8pXyBfXyAgIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX19cclxuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcclxuICAgICAqICB8IHxfX198IHwgfCAoXykgXFxfXyBcXF9fIFxcIHwgfF98IHwgfCAgfCB8IChffCB8IHwgfCB8IHwgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cclxuICAgICAqICAgXFxfX19ffF98ICBcXF9fXy98X19fL19fXy8gIFxcX19fL3xffCAgfF98XFxfXywgfF98X3wgfF98IHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGNvcnMgPSBjb3JzTWlkZGxld2FyZShvcHRpb25zLmNvcnMpO1xyXG5cclxuICAgIGNvbnN0IG5leHQgPSAocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSA9PiBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm91dGVyLmxvb2t1cChyZXEsIHJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XHJcbiAgICAgICAgbG9nLmRlYnVnKHJlcS5tZXRob2QhLCByZXEudXJsKTtcclxuICAgICAgICBjb3JzKHJlcSwgcmVzLCBuZXh0KHJlcSwgcmVzKSk7XHJcbiAgICB9O1xyXG59XHJcbiJdfQ==