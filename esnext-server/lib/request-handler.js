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
exports.useRequestHandler = (0, nano_memoize_1.default)((options) => {
    const { provideResource } = (0, resource_provider_1.useResourceProvider)(options);
    const { http2Push } = (0, http2_push_1.useHttp2Push)(options);
    const router = (0, router_1.createRouter)(options);
    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    router.get("/resources/*", function resourcesMiddleware(req, res) {
        const { pathname } = (0, fast_url_parser_1.parse)(req.url);
        const filename = path_1.default.join(options.resources, pathname.substring(10));
        sendFile(filename, res);
    });
    function sendFile(filename, res) {
        (0, fs_1.readFile)(filename, (err, data) => {
            if (err) {
                res.writeHead(http_status_codes_1.default.NOT_FOUND);
                res.end();
            }
            else {
                res.writeHead(http_status_codes_1.default.OK, {
                    "content-type": (0, mime_types_1.contentType)(filename),
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
    const cors = (0, cors_1.default)(options.cors);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLGdFQUFvQztBQUNwQyxnREFBaUM7QUFDakMsd0VBQW1DO0FBRW5DLHFFQUFrRTtBQUNsRSxxQ0FBc0M7QUFDdEMsa0RBQStDO0FBQy9DLGtEQUE4QztBQUlqQyxRQUFBLGlCQUFpQixHQUFHLElBQUEsc0JBQVEsRUFBQyxDQUFvQixPQUFzQixFQUFFLEVBQUU7SUFFcEYsTUFBTSxFQUFDLGVBQWUsRUFBQyxHQUFHLElBQUEsdUNBQW1CLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxFQUFDLFNBQVMsRUFBQyxHQUFHLElBQUEseUJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxJQUFBLHFCQUFZLEVBQUksT0FBTyxDQUFDLENBQUM7SUFFeEM7Ozs7Ozs7T0FPRztJQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFNBQVMsbUJBQW1CLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFDNUUsTUFBTSxFQUFDLFFBQVEsRUFBQyxHQUFHLElBQUEsdUJBQVEsRUFBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxRQUFRLENBQUksUUFBZ0IsRUFBRSxHQUEyRTtRQUM5RyxJQUFBLGFBQVEsRUFBQyxRQUFR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LGNBQWMsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUNuRCwwQkFBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQgUm91dGVyLCB7UmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBwYXRoLCB7cG9zaXh9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtjcmVhdGVSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xyXG5cclxudHlwZSBWZXJzaW9uID0gUm91dGVyLkhUVFBWZXJzaW9uLlYxIHwgUm91dGVyLkhUVFBWZXJzaW9uLlYyO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVJlcXVlc3RIYW5kbGVyID0gbWVtb2l6ZWQoPFYgZXh0ZW5kcyBWZXJzaW9uPihvcHRpb25zOiBFU05leHRPcHRpb25zKSA9PiB7XHJcblxyXG4gICAgY29uc3Qge3Byb3ZpZGVSZXNvdXJjZX0gPSB1c2VSZXNvdXJjZVByb3ZpZGVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2h0dHAyUHVzaH0gPSB1c2VIdHRwMlB1c2gob3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3Qgcm91dGVyID0gY3JlYXRlUm91dGVyPFY+KG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICBfX19fICBfICAgICAgICBfICAgXyAgICAgICAgX19fX1xyXG4gICAgICogIC8gX19ffHwgfF8gX18gX3wgfF8oXykgX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgXFxfX18gXFx8IF9fLyBfYCB8IF9ffCB8LyBfX3wgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxyXG4gICAgICogICBfX18pIHwgfHwgKF98IHwgfF98IHwgKF9fICB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxyXG4gICAgICogIHxfX19fLyBcXF9fXFxfXyxffFxcX198X3xcXF9fX3wgfF98IFxcX1xcX19ffHxfX18vXFxfX18vIFxcX18sX3xffCAgXFxfX19cXF9fX3x8X19fL1xyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi9yZXNvdXJjZXMvKlwiLCBmdW5jdGlvbiByZXNvdXJjZXNNaWRkbGV3YXJlKHJlcTogUmVxPFY+LCByZXM6IFJlczxWPikge1xyXG4gICAgICAgIGNvbnN0IHtwYXRobmFtZX0gPSBwYXJzZVVSTChyZXEudXJsKTtcclxuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGguam9pbihvcHRpb25zLnJlc291cmNlcywgcGF0aG5hbWUuc3Vic3RyaW5nKDEwKSk7XHJcbiAgICAgICAgc2VuZEZpbGUoZmlsZW5hbWUsIHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBzZW5kRmlsZTxWPihmaWxlbmFtZTogc3RyaW5nLCByZXM6IFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24uVjEgPyBTZXJ2ZXJSZXNwb25zZSA6IEh0dHAyU2VydmVyUmVzcG9uc2UpIHtcclxuICAgICAgICByZWFkRmlsZShmaWxlbmFtZSwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKEh0dHBTdGF0dXMuTk9UX0ZPVU5EKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5PSywge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlKGZpbGVuYW1lKSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJwdWJsaWMsIG1heC1hZ2U9ODY0MDAsIGltbXV0YWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqICBfXyAgICAgICAgX18gICAgICAgICBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9fX19cclxuICAgICAqICBcXCBcXCAgICAgIC8gL19fICBfIF9ffCB8IF9fX19fIF8gX18gICBfXyBfICBfX18gX19fICB8ICBfIFxcIF9fXyAgX19fICBfX18gIF8gICBfIF8gX18gX19fIF9fXyAgX19fXHJcbiAgICAgKiAgIFxcIFxcIC9cXCAvIC8gXyBcXHwgJ19ffCB8LyAvIF9ffCAnXyBcXCAvIF9gIHwvIF9fLyBfIFxcIHwgfF8pIC8gXyBcXC8gX198LyBfIFxcfCB8IHwgfCAnX18vIF9fLyBfIFxcLyBfX3xcclxuICAgICAqICAgIFxcIFYgIFYgLyAoXykgfCB8ICB8ICAgPFxcX18gXFwgfF8pIHwgKF98IHwgKF98ICBfXy8gfCAgXyA8ICBfXy9cXF9fIFxcIChfKSB8IHxffCB8IHwgfCAoX3wgIF9fL1xcX18gXFxcclxuICAgICAqICAgICBcXF8vXFxfLyBcXF9fXy98X3wgIHxffFxcX1xcX19fLyAuX18vIFxcX18sX3xcXF9fX1xcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X3xcclxuICAgICAqL1xyXG4gICAgcm91dGVyLmdldChcIi8qXCIsIGFzeW5jIGZ1bmN0aW9uIHdvcmtzcGFjZU1pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcblxyXG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsLCBpc0hNUjtcclxuICAgICAgICBpZiAodXJsKSB0cnkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aChcIi5ITVJcIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBobXJRdWVyeSA9IHVybC5sYXN0SW5kZXhPZihcInY9XCIpO1xyXG4gICAgICAgICAgICAgICAgaXNITVIgPSBobXJRdWVyeSA+IDA7XHJcbiAgICAgICAgICAgICAgICB1cmwgPSBpc0hNUiA/IHVybC5zbGljZSgwLCBobXJRdWVyeSAtIDEpIDogdXJsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQge1xyXG4gICAgICAgICAgICAgICAgcGF0aG5hbWUsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzLFxyXG4gICAgICAgICAgICAgICAgY29udGVudCxcclxuICAgICAgICAgICAgICAgIGxpbmtzXHJcbiAgICAgICAgICAgIH0gPSBhd2FpdCBwcm92aWRlUmVzb3VyY2UodXJsKTtcclxuXHJcbiAgICAgICAgICAgIGhlYWRlcnMgPSB7Li4uaGVhZGVyc307XHJcblxyXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwcmVsb2FkXCIgJiYgIWlzSE1SKSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzLmxpbmsgPSBsaW5rcy5tYXAobGluayA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKGxpbmspLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJmYWlsZWQgdG8gcHJlLXdhcm0gY2FjaGUgd2l0aDpcIiwgbGluayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8JHtsaW5rfT47IGNyb3Nzb3JpZ2luOyByZWw9cHJlbG9hZDsgYXM9JHtsaW5rLmVuZHNXaXRoKFwiLmNzc1wiKSA/IFwic3R5bGVcIiA6IFwic2NyaXB0XCJ9YDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgaGVhZGVycyk7XHJcblxyXG4gICAgICAgICAgICBpZiAobGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwdXNoXCIgJiYgcmVzIGluc3RhbmNlb2YgSHR0cDJTZXJ2ZXJSZXNwb25zZSAmJiAhaXNITVIpIHtcclxuICAgICAgICAgICAgICAgIGh0dHAyUHVzaChyZXMuc3RyZWFtLCBwYXRobmFtZSwgbGlua3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMuZW5kKGNvbnRlbnQpO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qge2NvZGUsIGhlYWRlcnMgPSB7fSwgbWVzc2FnZSwgc3RhY2t9ID0gZXJyb3I7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgaGFuZGxpbmc6ICR7dXJsfWA7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChjb2RlLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoc3RhY2spO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IEh0dHBTdGF0dXMuZ2V0U3RhdHVzVGV4dChjb2RlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAzMDgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0b2RvOiBjaGVjayBwZXJtYW5lbnQgcmVkaXJlY3QgYmVoYXZpb3VyXHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLndhcm5gJHtjb2RlfSAnJHt0ZXh0fScgJHt1cmx9IC0+ICR7aGVhZGVycy5sb2NhdGlvbn1gO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgJHttZXNzYWdlIHx8IFwiaGFuZGxpbmc6IFwiICsgdXJsfWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICAgX19fXyAgICAgICAgICAgICAgICAgICAgICBfX18gICAgICAgXyAgICAgICBfICAgICAgICAgX18gIF9fIF8gICAgIF8gICAgIF8gX1xyXG4gICAgICogICAvIF9fX3xfIF9fIF9fXyAgX19fIF9fXyAgIC8gXyBcXCBfIF9fKF8pIF9fIF8oXylfIF9fICAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fX1xyXG4gICAgICogIHwgfCAgIHwgJ19fLyBfIFxcLyBfXy8gX198IHwgfCB8IHwgJ19ffCB8LyBfYCB8IHwgJ18gXFwgIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxyXG4gICAgICogIHwgfF9fX3wgfCB8IChfKSBcXF9fIFxcX18gXFwgfCB8X3wgfCB8ICB8IHwgKF98IHwgfCB8IHwgfCB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xyXG4gICAgICogICBcXF9fX198X3wgIFxcX19fL3xfX18vX19fLyAgXFxfX18vfF98ICB8X3xcXF9fLCB8X3xffCB8X3wgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fXy9cclxuICAgICAqL1xyXG4gICAgY29uc3QgY29ycyA9IGNvcnNNaWRkbGV3YXJlKG9wdGlvbnMuY29ycyk7XHJcblxyXG4gICAgY29uc3QgbmV4dCA9IChyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pID0+IGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb3V0ZXIubG9va3VwKHJlcSwgcmVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0SGFuZGxlcihyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pOiB2b2lkIHtcclxuICAgICAgICBsb2cuZGVidWcocmVxLm1ldGhvZCEsIHJlcS51cmwpO1xyXG4gICAgICAgIGNvcnMocmVxLCByZXMsIG5leHQocmVxLCByZXMpKTtcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=