"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequestHandler = void 0;
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
const pico_memoize_1 = __importDefault(require("pico-memoize"));
exports.useRequestHandler = pico_memoize_1.default((options) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options);
    const { http2Push } = http2_push_1.useHttp2Push(options);
    const router = router_1.createRouter(options);
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLCtCQUFpQztBQUNqQyx3RUFBbUM7QUFFbkMscUVBQWtFO0FBQ2xFLHFDQUFzQztBQUN0QyxrREFBK0M7QUFDL0Msa0RBQThDO0FBQzlDLGdFQUFtQztBQUV0QixRQUFBLGlCQUFpQixHQUFHLHNCQUFPLENBQUMsQ0FBK0IsT0FBc0IsRUFBRSxFQUFFO0lBRTlGLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcseUJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxxQkFBWSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRXhDOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUN4RixRQUFRLENBQUMsT0FBTyxDQUFDLE9B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Q0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcbmltcG9ydCB7cGFyc2UgYXMgcGFyc2VVUkx9IGZyb20gXCJmYXN0LXVybC1wYXJzZXJcIjtcbmltcG9ydCBSb3V0ZXIsIHtSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7U2VydmVyUmVzcG9uc2V9IGZyb20gXCJodHRwXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XG5pbXBvcnQge2pvaW4sIHBvc2l4fSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XG5pbXBvcnQge2NyZWF0ZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcblxuZXhwb3J0IGNvbnN0IHVzZVJlcXVlc3RIYW5kbGVyID0gbWVtb2l6ZSg8ViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbj4ob3B0aW9uczogRVNOZXh0T3B0aW9ucykgPT4ge1xuXG4gICAgY29uc3Qge3Byb3ZpZGVSZXNvdXJjZX0gPSB1c2VSZXNvdXJjZVByb3ZpZGVyKG9wdGlvbnMpO1xuICAgIGNvbnN0IHtodHRwMlB1c2h9ID0gdXNlSHR0cDJQdXNoKG9wdGlvbnMpO1xuXG4gICAgY29uc3Qgcm91dGVyID0gY3JlYXRlUm91dGVyPFY+KG9wdGlvbnMpO1xuXG4gICAgLyoqXG4gICAgICogICBfX19fICBfICAgICAgICBfICAgXyAgICAgICAgX19fX1xuICAgICAqICAvIF9fX3x8IHxfIF9fIF98IHxfKF8pIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xuICAgICAqICBcXF9fXyBcXHwgX18vIF9gIHwgX198IHwvIF9ffCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XG4gICAgICogICBfX18pIHwgfHwgKF98IHwgfF98IHwgKF9fICB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxuICAgICAqICB8X19fXy8gXFxfX1xcX18sX3xcXF9ffF98XFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cbiAgICAgKlxuICAgICAqL1xuICAgIHJvdXRlci5nZXQoXCIvcmVzb3VyY2VzLypcIiwgZnVuY3Rpb24gcmVzb3VyY2VzTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcbiAgICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IHBhcnNlVVJMKHJlcS51cmwpO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGpvaW4ob3B0aW9ucy5yZXNvdXJjZXMsIHBhdGhuYW1lLnN1YnN0cmluZygxMCkpO1xuICAgICAgICBzZW5kRmlsZShmaWxlbmFtZSwgcmVzKTtcbiAgICB9KTtcblxuICAgIHJvdXRlci5nZXQoXCIvZXNuZXh0LXNlcnZlci9jbGllbnQuanNcIiwgZnVuY3Rpb24gcmVzb3VyY2VzTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcbiAgICAgICAgc2VuZEZpbGUocmVxdWlyZS5yZXNvbHZlKHBvc2l4LmpvaW4oXCJlc25leHQtc2VydmVyLWNsaWVudC9kaXN0L2luZGV4LmpzXCIpKSwgcmVzKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHNlbmRGaWxlPFY+KGZpbGVuYW1lOiBzdHJpbmcsIHJlczogViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbi5WMSA/IFNlcnZlclJlc3BvbnNlIDogSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xuICAgICAgICByZWFkRmlsZShmaWxlbmFtZSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5OT1RfRk9VTkQpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk9LLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwicHVibGljLCBtYXgtYWdlPTg2NDAwLCBpbW11dGFibGVcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cbiAgICAgKiAgXFwgXFwgICAgICAvIC9fXyAgXyBfX3wgfCBfX19fXyBfIF9fICAgX18gXyAgX19fIF9fXyAgfCAgXyBcXCBfX18gIF9fXyAgX19fICBfICAgXyBfIF9fIF9fXyBfX18gIF9fX1xuICAgICAqICAgXFwgXFwgL1xcIC8gLyBfIFxcfCAnX198IHwvIC8gX198ICdfIFxcIC8gX2AgfC8gX18vIF8gXFwgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcbiAgICAgKiAgICAgXFxfL1xcXy8gXFxfX18vfF98ICB8X3xcXF9cXF9fXy8gLl9fLyBcXF9fLF98XFxfX19cXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxffFxuICAgICAqL1xuICAgIHJvdXRlci5nZXQoXCIvKlwiLCBhc3luYyBmdW5jdGlvbiB3b3Jrc3BhY2VNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuXG4gICAgICAgIGlmIChyZXEudXJsKSB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhd2FpdCBwcm92aWRlUmVzb3VyY2UocmVxLnVybCk7XG5cbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5saW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInByZWxvYWRcIikge1xuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnMubGluayA9IHJlc291cmNlLmxpbmtzLm1hcChsaW5rID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKGxpbmspLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwiZmFpbGVkIHRvIHByZS13YXJtIGNhY2hlIHdpdGg6XCIsIGxpbmspO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8JHtsaW5rfT47IGNyb3Nzb3JpZ2luOyByZWw9cHJlbG9hZDsgYXM9JHtsaW5rLmVuZHNXaXRoKFwiLmNzc1wiKSA/IFwic3R5bGVcIiA6IFwic2NyaXB0XCJ9YDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHJlc291cmNlLmhlYWRlcnMpO1xuXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UubGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwdXNoXCIgJiYgcmVzIGluc3RhbmNlb2YgSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCByZXNvdXJjZS5wYXRobmFtZSwgcmVzb3VyY2UubGlua3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMuZW5kKHJlc291cmNlLmNvbnRlbnQpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCB7Y29kZSwgaGVhZGVycyA9IHt9LCBtZXNzYWdlLCBzdGFja30gPSBlcnJvcjtcbiAgICAgICAgICAgIGlmIChzdGFjaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUjtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xuICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyBoYW5kbGluZzogJHtyZXEudXJsfWA7XG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoc3RhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAzMDgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogY2hlY2sgcGVybWFuZW50IHJlZGlyZWN0IGJlaGF2aW91clxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybmAke2NvZGV9ICcke3RleHR9JyAke3JlcS51cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyAke21lc3NhZ2UgfHwgXCJoYW5kbGluZzogXCIgKyByZXEudXJsfWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogICAgX19fXyAgICAgICAgICAgICAgICAgICAgICBfX18gICAgICAgXyAgICAgICBfICAgICAgICAgX18gIF9fIF8gICAgIF8gICAgIF8gX1xuICAgICAqICAgLyBfX198XyBfXyBfX18gIF9fXyBfX18gICAvIF8gXFwgXyBfXyhfKSBfXyBfKF8pXyBfXyAgIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX19cbiAgICAgKiAgfCB8ICAgfCAnX18vIF8gXFwvIF9fLyBfX3wgfCB8IHwgfCAnX198IHwvIF9gIHwgfCAnXyBcXCAgfCB8XFwvfCB8IHwvIF9gIHwvIF9gIHwgfC8gXyBcXCBcXCAvXFwgLyAvIF9gIHwgJ19fLyBfIFxcXG4gICAgICogIHwgfF9fX3wgfCB8IChfKSBcXF9fIFxcX18gXFwgfCB8X3wgfCB8ICB8IHwgKF98IHwgfCB8IHwgfCB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xuICAgICAqICAgXFxfX19ffF98ICBcXF9fXy98X19fL19fXy8gIFxcX19fL3xffCAgfF98XFxfXywgfF98X3wgfF98IHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fL1xuICAgICAqL1xuICAgIGNvbnN0IGNvcnMgPSBjb3JzTWlkZGxld2FyZShvcHRpb25zLmNvcnMpO1xuXG4gICAgY29uc3QgbmV4dCA9IChyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pID0+IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm91dGVyLmxvb2t1cChyZXEsIHJlcyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RIYW5kbGVyKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPik6IHZvaWQge1xuICAgICAgICBsb2cuZGVidWcocmVxLm1ldGhvZCEsIHJlcS51cmwpO1xuICAgICAgICBjb3JzKHJlcSwgcmVzLCBuZXh0KHJlcSwgcmVzKSk7XG4gICAgfTtcbn0pO1xuIl19