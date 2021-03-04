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
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("./providers/resource-provider");
const router_1 = require("./router");
const http2_push_1 = require("./util/http2-push");
const mime_types_1 = require("./util/mime-types");
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
        const filename = path_1.default.join(options.resources, pathname.substring(10));
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
        let url = req.url, isHMR;
        if (url)
            try {
                if (url.endsWith(".HMR")) {
                    let hmrQuery = url.lastIndexOf("v=");
                    isHMR = hmrQuery > 0;
                    url = isHMR ? url.slice(0, hmrQuery - 1) : url;
                }
                let { pathname, headers, content, links } = await provideResource(url);
                headers = { ...headers };
                if (links && options.http2 === "preload" && !isHMR) {
                    headers.link = links.map(link => {
                        provideResource(link).catch(function () {
                            tiny_node_logger_1.default.warn("failed to pre-warm cache with:", link);
                        });
                        return `<${link}>; crossorigin; rel=preload; as=${link.endsWith(".css") ? "style" : "script"}`;
                    });
                }
                res.writeHead(200, headers);
                if (links && options.http2 === "push" && res instanceof http2_1.Http2ServerResponse && !isHMR) {
                    http2Push(res.stream, pathname, links);
                }
                res.end(content);
            }
            catch (error) {
                const { code, headers = {}, message, stack } = error;
                if (stack) {
                    const code = http_status_codes_1.default.INTERNAL_SERVER_ERROR;
                    const text = http_status_codes_1.default.getStatusText(code);
                    tiny_node_logger_1.default.error `${code} '${text}' handling: ${url}`;
                    tiny_node_logger_1.default.error(error);
                    res.writeHead(code, headers);
                    res.end(stack);
                }
                else {
                    const text = http_status_codes_1.default.getStatusText(code);
                    if (code === 308) {
                        // todo: check permanent redirect behaviour
                        tiny_node_logger_1.default.warn `${code} '${text}' ${url} -> ${headers.location}`;
                    }
                    else {
                        tiny_node_logger_1.default.error `${code} '${text}' ${message || "handling: " + url}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLGdFQUFvQztBQUNwQyxnREFBaUM7QUFDakMsd0VBQW1DO0FBRW5DLHFFQUFrRTtBQUNsRSxxQ0FBc0M7QUFDdEMsa0RBQStDO0FBQy9DLGtEQUE4QztBQUlqQyxRQUFBLGlCQUFpQixHQUFHLHNCQUFRLENBQUMsQ0FBb0IsT0FBc0IsRUFBRSxFQUFFO0lBRXBGLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcseUJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxxQkFBWSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRXhDOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLFFBQVEsQ0FBSSxRQUFnQixFQUFFLEdBQTJFO1FBQzlHLGFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFF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QUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb3JzTWlkZGxld2FyZSBmcm9tIFwiY29yc1wiO1xyXG5pbXBvcnQge3BhcnNlIGFzIHBhcnNlVVJMfSBmcm9tIFwiZmFzdC11cmwtcGFyc2VyXCI7XHJcbmltcG9ydCBSb3V0ZXIsIHtSZXEsIFJlc30gZnJvbSBcImZpbmQtbXktd2F5XCI7XHJcbmltcG9ydCB7cmVhZEZpbGV9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge1NlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cFwiO1xyXG5pbXBvcnQgSHR0cFN0YXR1cyBmcm9tIFwiaHR0cC1zdGF0dXMtY29kZXNcIjtcclxuaW1wb3J0IHtIdHRwMlNlcnZlclJlc3BvbnNlfSBmcm9tIFwiaHR0cDJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGgsIHtwb3NpeH0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3VzZVJlc291cmNlUHJvdmlkZXJ9IGZyb20gXCIuL3Byb3ZpZGVycy9yZXNvdXJjZS1wcm92aWRlclwiO1xyXG5pbXBvcnQge2NyZWF0ZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XHJcbmltcG9ydCB7dXNlSHR0cDJQdXNofSBmcm9tIFwiLi91dGlsL2h0dHAyLXB1c2hcIjtcclxuaW1wb3J0IHtjb250ZW50VHlwZX0gZnJvbSBcIi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcblxyXG50eXBlIFZlcnNpb24gPSBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgfCBSb3V0ZXIuSFRUUFZlcnNpb24uVjI7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlUmVxdWVzdEhhbmRsZXIgPSBtZW1vaXplZCg8ViBleHRlbmRzIFZlcnNpb24+KG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7aHR0cDJQdXNofSA9IHVzZUh0dHAyUHVzaChvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCByb3V0ZXIgPSBjcmVhdGVSb3V0ZXI8Vj4ob3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgIF9fX18gIF8gICAgICAgIF8gICBfICAgICAgICBfX19fXHJcbiAgICAgKiAgLyBfX198fCB8XyBfXyBffCB8XyhfKSBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cclxuICAgICAqICBcXF9fXyBcXHwgX18vIF9gIHwgX198IHwvIF9ffCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XHJcbiAgICAgKiAgIF9fXykgfCB8fCAoX3wgfCB8X3wgfCAoX18gIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXHJcbiAgICAgKiAgfF9fX18vIFxcX19cXF9fLF98XFxfX3xffFxcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICByb3V0ZXIuZ2V0KFwiL3Jlc291cmNlcy8qXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IHBhcnNlVVJMKHJlcS51cmwpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aC5qb2luKG9wdGlvbnMucmVzb3VyY2VzLCBwYXRobmFtZS5zdWJzdHJpbmcoMTApKTtcclxuICAgICAgICBzZW5kRmlsZShmaWxlbmFtZSwgcmVzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNlbmRGaWxlPFY+KGZpbGVuYW1lOiBzdHJpbmcsIHJlczogViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbi5WMSA/IFNlcnZlclJlc3BvbnNlIDogSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xyXG4gICAgICAgIHJlYWRGaWxlKGZpbGVuYW1lLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5OT1RfRk9VTkQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk9LLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogY29udGVudFR5cGUoZmlsZW5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIF9fICAgICAgICBfXyAgICAgICAgIF8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX19fX1xyXG4gICAgICogIFxcIFxcICAgICAgLyAvX18gIF8gX198IHwgX19fX18gXyBfXyAgIF9fIF8gIF9fXyBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cclxuICAgICAqICAgXFwgXFwgL1xcIC8gLyBfIFxcfCAnX198IHwvIC8gX198ICdfIFxcIC8gX2AgfC8gX18vIF8gXFwgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxyXG4gICAgICogICAgXFwgViAgViAvIChfKSB8IHwgIHwgICA8XFxfXyBcXCB8XykgfCAoX3wgfCAoX3wgIF9fLyB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxyXG4gICAgICogICAgIFxcXy9cXF8vIFxcX19fL3xffCAgfF98XFxfXFxfX18vIC5fXy8gXFxfXyxffFxcX19fXFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxffFxyXG4gICAgICovXHJcbiAgICByb3V0ZXIuZ2V0KFwiLypcIiwgYXN5bmMgZnVuY3Rpb24gd29ya3NwYWNlTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuXHJcbiAgICAgICAgbGV0IHVybCA9IHJlcS51cmwsIGlzSE1SO1xyXG4gICAgICAgIGlmICh1cmwpIHRyeSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodXJsLmVuZHNXaXRoKFwiLkhNUlwiKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGhtclF1ZXJ5ID0gdXJsLmxhc3RJbmRleE9mKFwidj1cIik7XHJcbiAgICAgICAgICAgICAgICBpc0hNUiA9IGhtclF1ZXJ5ID4gMDtcclxuICAgICAgICAgICAgICAgIHVybCA9IGlzSE1SID8gdXJsLnNsaWNlKDAsIGhtclF1ZXJ5IC0gMSkgOiB1cmw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB7XHJcbiAgICAgICAgICAgICAgICBwYXRobmFtZSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnMsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50LFxyXG4gICAgICAgICAgICAgICAgbGlua3NcclxuICAgICAgICAgICAgfSA9IGF3YWl0IHByb3ZpZGVSZXNvdXJjZSh1cmwpO1xyXG5cclxuICAgICAgICAgICAgaGVhZGVycyA9IHsuLi5oZWFkZXJzfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsaW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInByZWxvYWRcIiAmJiAhaXNITVIpIHtcclxuICAgICAgICAgICAgICAgIGhlYWRlcnMubGluayA9IGxpbmtzLm1hcChsaW5rID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlUmVzb3VyY2UobGluaykuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcImZhaWxlZCB0byBwcmUtd2FybSBjYWNoZSB3aXRoOlwiLCBsaW5rKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDwke2xpbmt9PjsgY3Jvc3NvcmlnaW47IHJlbD1wcmVsb2FkOyBhcz0ke2xpbmsuZW5kc1dpdGgoXCIuY3NzXCIpID8gXCJzdHlsZVwiIDogXCJzY3JpcHRcIn1gO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCBoZWFkZXJzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChsaW5rcyAmJiBvcHRpb25zLmh0dHAyID09PSBcInB1c2hcIiAmJiByZXMgaW5zdGFuY2VvZiBIdHRwMlNlcnZlclJlc3BvbnNlICYmICFpc0hNUikge1xyXG4gICAgICAgICAgICAgICAgaHR0cDJQdXNoKHJlcy5zdHJlYW0sIHBhdGhuYW1lLCBsaW5rcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy5lbmQoY29udGVudCk7XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7Y29kZSwgaGVhZGVycyA9IHt9LCBtZXNzYWdlLCBzdGFja30gPSBlcnJvcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGFjaykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IEh0dHBTdGF0dXMuSU5URVJOQUxfU0VSVkVSX0VSUk9SO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IEh0dHBTdGF0dXMuZ2V0U3RhdHVzVGV4dChjb2RlKTtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyBoYW5kbGluZzogJHt1cmx9YDtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChzdGFjayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gSHR0cFN0YXR1cy5nZXRTdGF0dXNUZXh0KGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDMwOCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86IGNoZWNrIHBlcm1hbmVudCByZWRpcmVjdCBiZWhhdmlvdXJcclxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybmAke2NvZGV9ICcke3RleHR9JyAke3VybH0gLT4gJHtoZWFkZXJzLmxvY2F0aW9ufWA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyAke21lc3NhZ2UgfHwgXCJoYW5kbGluZzogXCIgKyB1cmx9YDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgICBfX19fICAgICAgICAgICAgICAgICAgICAgIF9fXyAgICAgICBfICAgICAgIF8gICAgICAgICBfXyAgX18gXyAgICAgXyAgICAgXyBfXHJcbiAgICAgKiAgIC8gX19ffF8gX18gX19fICBfX18gX19fICAgLyBfIFxcIF8gX18oXykgX18gXyhfKV8gX18gICB8ICBcXC8gIChfKSBfX3wgfCBfX3wgfCB8IF9fX19fICAgICAgX19fXyBfIF8gX18gX19fXHJcbiAgICAgKiAgfCB8ICAgfCAnX18vIF8gXFwvIF9fLyBfX3wgfCB8IHwgfCAnX198IHwvIF9gIHwgfCAnXyBcXCAgfCB8XFwvfCB8IHwvIF9gIHwvIF9gIHwgfC8gXyBcXCBcXCAvXFwgLyAvIF9gIHwgJ19fLyBfIFxcXHJcbiAgICAgKiAgfCB8X19ffCB8IHwgKF8pIFxcX18gXFxfXyBcXCB8IHxffCB8IHwgIHwgfCAoX3wgfCB8IHwgfCB8IHwgfCAgfCB8IHwgKF98IHwgKF98IHwgfCAgX18vXFwgViAgViAvIChffCB8IHwgfCAgX18vXHJcbiAgICAgKiAgIFxcX19fX3xffCAgXFxfX18vfF9fXy9fX18vICBcXF9fXy98X3wgIHxffFxcX18sIHxffF98IHxffCB8X3wgIHxffF98XFxfXyxffFxcX18sX3xffFxcX19ffCBcXF8vXFxfLyBcXF9fLF98X3wgIFxcX19ffFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fL1xyXG4gICAgICovXHJcbiAgICBjb25zdCBjb3JzID0gY29yc01pZGRsZXdhcmUob3B0aW9ucy5jb3JzKTtcclxuXHJcbiAgICBjb25zdCBuZXh0ID0gKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikgPT4gZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJvdXRlci5sb29rdXAocmVxLCByZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RIYW5kbGVyKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPik6IHZvaWQge1xyXG4gICAgICAgIGxvZy5kZWJ1ZyhyZXEubWV0aG9kISwgcmVxLnVybCk7XHJcbiAgICAgICAgY29ycyhyZXEsIHJlcywgbmV4dChyZXEsIHJlcykpO1xyXG4gICAgfTtcclxufSk7XHJcbiJdfQ==