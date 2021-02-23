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
    router.get("/esnext-server/client.js", function resourcesMiddleware(req, res) {
        sendFile(require.resolve(path_1.posix.join("esnext-server-client/dist/index.js")), res);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLCtCQUFpQztBQUNqQyx3RUFBbUM7QUFFbkMscUVBQWtFO0FBQ2xFLHFDQUFzQztBQUN0QyxrREFBK0M7QUFDL0Msa0RBQThDO0FBRTlDLFNBQWdCLG9CQUFvQixDQUF1RCxPQUFzQixFQUFFLE9BQWtCO0lBRWpJLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDaEUsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLHlCQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRW5ELE1BQU0sTUFBTSxHQUFHLHFCQUFZLENBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWpEOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUN4RixRQUFRLENBQUMsT0FBTyxDQUFD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QUcsQ0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQW5IRCxvREFtSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCBjb3JzTWlkZGxld2FyZSBmcm9tIFwiY29yc1wiO1xyXG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XHJcbmltcG9ydCBSb3V0ZXIsIHtSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XHJcbmltcG9ydCB7cmVhZEZpbGV9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge1NlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cFwiO1xyXG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcclxuaW1wb3J0IHtIdHRwMlNlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cDJcIjtcclxuaW1wb3J0IHtqb2luLCBwb3NpeH0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3VzZVJlc291cmNlUHJvdmlkZXJ9IGZyb20gXCIuL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xyXG5pbXBvcnQge2NyZWF0ZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XHJcbmltcG9ydCB7dXNlSHR0cDJQdXNofSBmcm9tIFwiLi91dGlsL2h0dHAyLXB1c2hcIjtcclxuaW1wb3J0IHtjb250ZW50VHlwZX0gZnJvbSBcIi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVxdWVzdEhhbmRsZXI8ViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbiA9IFJvdXRlci5IVFRQVmVyc2lvbi5WMT4ob3B0aW9uczogRVNOZXh0T3B0aW9ucywgd2F0Y2hlcjogRlNXYXRjaGVyKSB7XHJcblxyXG4gICAgY29uc3Qge3Byb3ZpZGVSZXNvdXJjZX0gPSB1c2VSZXNvdXJjZVByb3ZpZGVyKG9wdGlvbnMsIHdhdGNoZXIpO1xyXG4gICAgY29uc3Qge2h0dHAyUHVzaH0gPSB1c2VIdHRwMlB1c2gob3B0aW9ucywgd2F0Y2hlcik7XHJcblxyXG4gICAgY29uc3Qgcm91dGVyID0gY3JlYXRlUm91dGVyPFY+KG9wdGlvbnMsIHdhdGNoZXIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICBfX19fICBfICAgICAgICBfICAgXyAgICAgICAgX19fX1xyXG4gICAgICogIC8gX19ffHwgfF8gX18gX3wgfF8oXykgX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgXFxfX18gXFx8IF9fLyBfYCB8IF9ffCB8LyBfX3wgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxyXG4gICAgICogICBfX18pIHwgfHwgKF98IHwgfF98IHwgKF9fICB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxyXG4gICAgICogIHxfX19fLyBcXF9fXFxfXyxffFxcX198X3xcXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi9yZXNvdXJjZXMvKlwiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xyXG4gICAgICAgIGNvbnN0IHtwYXRobmFtZX0gPSBwYXJzZVVSTChyZXEudXJsKTtcclxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGpvaW4ob3B0aW9ucy5yZXNvdXJjZXMsIHBhdGhuYW1lLnN1YnN0cmluZygxMCkpO1xyXG4gICAgICAgIHNlbmRGaWxlKGZpbGVuYW1lLCByZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcm91dGVyLmdldChcIi9lc25leHQtc2VydmVyL2NsaWVudC5qc1wiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xyXG4gICAgICAgIHNlbmRGaWxlKHJlcXVpcmUucmVzb2x2ZShwb3NpeC5qb2luKFwiZXNuZXh0LXNlcnZlci1jbGllbnQvZGlzdC9pbmRleC5qc1wiKSksIHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZW5kRmlsZTxWPihmaWxlbmFtZTogc3RyaW5nLCByZXM6IFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgPyBTZXJ2ZXJSZXNwb25zZSA6IEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcclxuICAgICAgICByZWFkRmlsZShmaWxlbmFtZSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5PSywge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cclxuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcblxyXG4gICAgICAgIGlmIChyZXEudXJsKSB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZShyZXEudXJsKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5saW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInByZWxvYWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVycy5saW5rID0gcmVzb3VyY2UubGlua3MubWFwKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVSZXNvdXJjZShsaW5rKS5jYXRjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZmFpbGVkIHRvIHByZS13YXJtIGNhY2hlIHdpdGg6XCIsIGxpbmspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgPCR7bGlua30+OyBjcm9zc29yaWdpbjsgcmVsPXByZWxvYWQ7IGFzPSR7bGluay5lbmRzV2l0aChcIi5jc3NcIikgPyBcInN0eWxlXCIgOiBcInNjcmlwdFwifWA7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHJlc291cmNlLmhlYWRlcnMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc291cmNlLmxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHVzaFwiICYmIHJlcyBpbnN0YW5jZW9mIEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCByZXNvdXJjZS5wYXRobmFtZSwgcmVzb3VyY2UubGlua3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMuZW5kKHJlc291cmNlLmNvbnRlbnQpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zdCB7Y29kZSwgaGVhZGVycyA9IHt9LCBtZXNzYWdlLCBzdGFja30gPSBlcnJvcjtcclxuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gSHR0cFN0YXR1cy5JTlRFUk5BTF9TRVJWRVJfRVJST1I7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3JlcS51cmx9YDtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChzdGFjayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDMwOCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86IGNoZWNrIHBlcm1hbmVudCByZWRpcmVjdCBiZWhhdmlvdXJcclxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybmAke2NvZGV9ICcke3RleHR9JyAke3JlcS51cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgJHttZXNzYWdlIHx8IFwiaGFuZGxpbmc6IFwiICsgcmVxLnVybH1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgIF9fX18gICAgICAgICAgICAgICAgICAgICAgX19fICAgICAgIF8gICAgICAgXyAgICAgICAgIF9fICBfXyBfICAgICBfICAgICBfIF9cclxuICAgICAqICAgLyBfX198XyBfXyBfX18gIF9fXyBfX18gICAvIF8gXFwgXyBfXyhfKSBfXyBfKF8pXyBfXyAgIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX19cclxuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcclxuICAgICAqICB8IHxfX198IHwgfCAoXykgXFxfXyBcXF9fIFxcIHwgfF98IHwgfCAgfCB8IChffCB8IHwgfCB8IHwgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cclxuICAgICAqICAgXFxfX19ffF98ICBcXF9fXy98X19fL19fXy8gIFxcX19fL3xffCAgfF98XFxfXywgfF98X3wgfF98IHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGNvcnMgPSBjb3JzTWlkZGxld2FyZShvcHRpb25zLmNvcnMpO1xyXG5cclxuICAgIGNvbnN0IG5leHQgPSAocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSA9PiBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm91dGVyLmxvb2t1cChyZXEsIHJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XHJcbiAgICAgICAgbG9nLmRlYnVnKHJlcS5tZXRob2QhLCByZXEudXJsKTtcclxuICAgICAgICBjb3JzKHJlcSwgcmVzLCBuZXh0KHJlcSwgcmVzKSk7XHJcbiAgICB9O1xyXG59XHJcbiJdfQ==