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
const nano_memoize_1 = __importDefault(require("nano-memoize"));
exports.useRequestHandler = nano_memoize_1.default((options) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLCtCQUFpQztBQUNqQyx3RUFBbUM7QUFFbkMscUVBQWtFO0FBQ2xFLHFDQUFzQztBQUN0QyxrREFBK0M7QUFDL0Msa0RBQThDO0FBQzlDLGdFQUFvQztBQUV2QixRQUFBLGlCQUFpQixHQUFHLHNCQUFRLENBQUMsQ0FBK0IsT0FBc0IsRUFBRSxFQUFFO0lBRS9GLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcseUJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxxQkFBWSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRXhDOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUN4RixRQUFRLENBQUMsT0FBTyxDQUFDLE9B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Q0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcbmltcG9ydCB7cGFyc2UgYXMgcGFyc2VVUkx9IGZyb20gXCJmYXN0LXVybC1wYXJzZXJcIjtcbmltcG9ydCBSb3V0ZXIsIHtSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7U2VydmVyUmVzcG9uc2V9IGZyb20gXCJodHRwXCI7XG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XG5pbXBvcnQge2pvaW4sIHBvc2l4fSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcbmltcG9ydCB7dXNlUmVzb3VyY2VQcm92aWRlcn0gZnJvbSBcIi4vcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyXCI7XG5pbXBvcnQge2NyZWF0ZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlfSBmcm9tIFwiLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5cbmV4cG9ydCBjb25zdCB1c2VSZXF1ZXN0SGFuZGxlciA9IG1lbW9pemVkKDxWIGV4dGVuZHMgUm91dGVyLkhUVFBWZXJzaW9uPihvcHRpb25zOiBFU05leHRPcHRpb25zKSA9PiB7XG5cbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge2h0dHAyUHVzaH0gPSB1c2VIdHRwMlB1c2gob3B0aW9ucyk7XG5cbiAgICBjb25zdCByb3V0ZXIgPSBjcmVhdGVSb3V0ZXI8Vj4ob3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiAgIF9fX18gIF8gICAgICAgIF8gICBfICAgICAgICBfX19fXG4gICAgICogIC8gX19ffHwgfF8gX18gX3wgfF8oXykgX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXG4gICAgICogIFxcX19fIFxcfCBfXy8gX2AgfCBfX3wgfC8gX198IHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcbiAgICAgKiAgIF9fXykgfCB8fCAoX3wgfCB8X3wgfCAoX18gIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXG4gICAgICogIHxfX19fLyBcXF9fXFxfXyxffFxcX198X3xcXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xuICAgICAqXG4gICAgICovXG4gICAgcm91dGVyLmdldChcIi9yZXNvdXJjZXMvKlwiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuICAgICAgICBjb25zdCB7cGF0aG5hbWV9ID0gcGFyc2VVUkwocmVxLnVybCk7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gam9pbihvcHRpb25zLnJlc291cmNlcywgcGF0aG5hbWUuc3Vic3RyaW5nKDEwKSk7XG4gICAgICAgIHNlbmRGaWxlKGZpbGVuYW1lLCByZXMpO1xuICAgIH0pO1xuXG4gICAgcm91dGVyLmdldChcIi9lc25leHQtc2VydmVyL2NsaWVudC5qc1wiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xuICAgICAgICBzZW5kRmlsZShyZXF1aXJlLnJlc29sdmUocG9zaXguam9pbihcImVzbmV4dC1zZXJ2ZXItY2xpZW50L2Rpc3QvaW5kZXguanNcIikpLCByZXMpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gc2VuZEZpbGU8Vj4oZmlsZW5hbWU6IHN0cmluZywgcmVzOiBWIGV4dGVuZHMgUm91dGVyLkhUVFBWZXJzaW9uLlYxID8gU2VydmVyUmVzcG9uc2UgOiBIdHRwMlNlcnZlclJlc3BvbnNlKSB7XG4gICAgICAgIHJlYWRGaWxlKGZpbGVuYW1lLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk5PVF9GT1VORCk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuT0ssIHtcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogY29udGVudFR5cGUoZmlsZW5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIF9fICAgICAgICBfXyAgICAgICAgIF8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX19fX1xuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXG4gICAgICogICBcXCBcXCAvXFwgLyAvIF8gXFx8ICdfX3wgfC8gLyBfX3wgJ18gXFwgLyBfYCB8LyBfXy8gXyBcXCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XG4gICAgICogICAgXFwgViAgViAvIChfKSB8IHwgIHwgICA8XFxfXyBcXCB8XykgfCAoX3wgfCAoX3wgIF9fLyB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF98XG4gICAgICovXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XG5cbiAgICAgICAgaWYgKHJlcS51cmwpIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZShyZXEudXJsKTtcblxuICAgICAgICAgICAgaWYgKHJlc291cmNlLmxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHJlbG9hZFwiKSB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVycy5saW5rID0gcmVzb3VyY2UubGlua3MubWFwKGxpbmsgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UobGluaykuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJmYWlsZWQgdG8gcHJlLXdhcm0gY2FjaGUgd2l0aDpcIiwgbGluayk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDwke2xpbmt9PjsgY3Jvc3NvcmlnaW47IHJlbD1wcmVsb2FkOyBhcz0ke2xpbmsuZW5kc1dpdGgoXCIuY3NzXCIpID8gXCJzdHlsZVwiIDogXCJzY3JpcHRcIn1gO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgcmVzb3VyY2UuaGVhZGVycyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5saW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInB1c2hcIiAmJiByZXMgaW5zdGFuY2VvZiBIdHRwMlNlcnZlclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaHR0cDJQdXNoKHJlcy5zdHJlYW0sIHJlc291cmNlLnBhdGhuYW1lLCByZXNvdXJjZS5saW5rcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlcy5lbmQocmVzb3VyY2UuY29udGVudCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHtjb2RlLCBoZWFkZXJzID0ge30sIG1lc3NhZ2UsIHN0YWNrfSA9IGVycm9yO1xuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XG4gICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nIGhhbmRsaW5nOiAke3JlcS51cmx9YDtcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChzdGFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDMwOCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiBjaGVjayBwZXJtYW5lbnQgcmVkaXJlY3QgYmVoYXZpb3VyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuYCR7Y29kZX0gJyR7dGV4dH0nICR7cmVxLnVybH0gLT4gJHtoZWFkZXJzLmxvY2F0aW9ufWA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yYCR7Y29kZX0gJyR7dGV4dH0nICR7bWVzc2FnZSB8fCBcImhhbmRsaW5nOiBcIiArIHJlcS51cmx9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiAgICBfX19fICAgICAgICAgICAgICAgICAgICAgIF9fXyAgICAgICBfICAgICAgIF8gICAgICAgICBfXyAgX18gXyAgICAgXyAgICAgXyBfXG4gICAgICogICAvIF9fX3xfIF9fIF9fXyAgX19fIF9fXyAgIC8gXyBcXCBfIF9fKF8pIF9fIF8oXylfIF9fICAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fX1xuICAgICAqICB8IHwgICB8ICdfXy8gXyBcXC8gX18vIF9ffCB8IHwgfCB8ICdfX3wgfC8gX2AgfCB8ICdfIFxcICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcbiAgICAgKiAgfCB8X19ffCB8IHwgKF8pIFxcX18gXFxfXyBcXCB8IHxffCB8IHwgIHwgfCAoX3wgfCB8IHwgfCB8IHwgfCAgfCB8IHwgKF98IHwgKF98IHwgfCAgX18vXFwgViAgViAvIChffCB8IHwgfCAgX18vXG4gICAgICogICBcXF9fX198X3wgIFxcX19fL3xfX18vX19fLyAgXFxfX18vfF98ICB8X3xcXF9fLCB8X3xffCB8X3wgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX18vXG4gICAgICovXG4gICAgY29uc3QgY29ycyA9IGNvcnNNaWRkbGV3YXJlKG9wdGlvbnMuY29ycyk7XG5cbiAgICBjb25zdCBuZXh0ID0gKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikgPT4gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb3V0ZXIubG9va3VwKHJlcSwgcmVzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KTogdm9pZCB7XG4gICAgICAgIGxvZy5kZWJ1ZyhyZXEubWV0aG9kISwgcmVxLnVybCk7XG4gICAgICAgIGNvcnMocmVxLCByZXMsIG5leHQocmVxLCByZXMpKTtcbiAgICB9O1xufSk7XG4iXX0=