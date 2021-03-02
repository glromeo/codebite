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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlcXVlc3QtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBa0M7QUFDbEMscURBQWtEO0FBRWxELDJCQUE0QjtBQUU1QiwwRUFBMkM7QUFDM0MsaUNBQTBDO0FBQzFDLCtCQUFpQztBQUNqQyx3RUFBbUM7QUFFbkMscUVBQWtFO0FBQ2xFLHFDQUFzQztBQUN0QyxrREFBK0M7QUFDL0Msa0RBQThDO0FBQzlDLGdFQUFvQztBQUV2QixRQUFBLGlCQUFpQixHQUFHLHNCQUFRLENBQUMsQ0FBK0IsT0FBc0IsRUFBRSxFQUFFO0lBRS9GLE1BQU0sRUFBQyxlQUFlLEVBQUMsR0FBRyx1Q0FBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxNQUFNLEVBQUMsU0FBUyxFQUFDLEdBQUcseUJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUxQyxNQUFNLE1BQU0sR0FBRyxxQkFBWSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRXhDOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLG1CQUFtQixDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQzVFLE1BQU0sRUFBQyxRQUFRLEVBQUMsR0FBRyx1QkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBRyxXQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakUsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxtQkFBbUIsQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUN4RixRQUFRLENBQUMsT0FBTyxDQUFDLE9B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Q0FBQyxDQUFDLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yc01pZGRsZXdhcmUgZnJvbSBcImNvcnNcIjtcclxuaW1wb3J0IHtwYXJzZSBhcyBwYXJzZVVSTH0gZnJvbSBcImZhc3QtdXJsLXBhcnNlclwiO1xyXG5pbXBvcnQgUm91dGVyLCB7UmVxLCBSZXN9IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQge3JlYWRGaWxlfSBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IEh0dHBTdGF0dXMgZnJvbSBcImh0dHAtc3RhdHVzLWNvZGVzXCI7XHJcbmltcG9ydCB7SHR0cDJTZXJ2ZXJSZXNwb25zZX0gZnJvbSBcImh0dHAyXCI7XHJcbmltcG9ydCB7am9pbiwgcG9zaXh9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VSZXNvdXJjZVByb3ZpZGVyfSBmcm9tIFwiLi9wcm92aWRlcnMvcmVzb3VyY2UtcHJvdmlkZXJcIjtcclxuaW1wb3J0IHtjcmVhdGVSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5pbXBvcnQge3VzZUh0dHAyUHVzaH0gZnJvbSBcIi4vdXRpbC9odHRwMi1wdXNoXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGV9IGZyb20gXCIuL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQgbWVtb2l6ZWQgZnJvbSBcIm5hbm8tbWVtb2l6ZVwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVJlcXVlc3RIYW5kbGVyID0gbWVtb2l6ZWQoPFYgZXh0ZW5kcyBSb3V0ZXIuSFRUUFZlcnNpb24+KG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMpID0+IHtcclxuXHJcbiAgICBjb25zdCB7cHJvdmlkZVJlc291cmNlfSA9IHVzZVJlc291cmNlUHJvdmlkZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7aHR0cDJQdXNofSA9IHVzZUh0dHAyUHVzaChvcHRpb25zKTtcclxuXHJcbiAgICBjb25zdCByb3V0ZXIgPSBjcmVhdGVSb3V0ZXI8Vj4ob3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgIF9fX18gIF8gICAgICAgIF8gICBfICAgICAgICBfX19fXHJcbiAgICAgKiAgLyBfX198fCB8XyBfXyBffCB8XyhfKSBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cclxuICAgICAqICBcXF9fXyBcXHwgX18vIF9gIHwgX198IHwvIF9ffCB8IHxfKSAvIF8gXFwvIF9ffC8gXyBcXHwgfCB8IHwgJ19fLyBfXy8gXyBcXC8gX198XHJcbiAgICAgKiAgIF9fXykgfCB8fCAoX3wgfCB8X3wgfCAoX18gIHwgIF8gPCAgX18vXFxfXyBcXCAoXykgfCB8X3wgfCB8IHwgKF98ICBfXy9cXF9fIFxcXHJcbiAgICAgKiAgfF9fX18vIFxcX19cXF9fLF98XFxfX3xffFxcX19ffCB8X3wgXFxfXFxfX198fF9fXy9cXF9fXy8gXFxfXyxffF98ICBcXF9fX1xcX19ffHxfX18vXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICByb3V0ZXIuZ2V0KFwiL3Jlc291cmNlcy8qXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgY29uc3Qge3BhdGhuYW1lfSA9IHBhcnNlVVJMKHJlcS51cmwpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gam9pbihvcHRpb25zLnJlc291cmNlcywgcGF0aG5hbWUuc3Vic3RyaW5nKDEwKSk7XHJcbiAgICAgICAgc2VuZEZpbGUoZmlsZW5hbWUsIHJlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByb3V0ZXIuZ2V0KFwiL2VzbmV4dC1zZXJ2ZXIvY2xpZW50LmpzXCIsIGZ1bmN0aW9uIHJlc291cmNlc01pZGRsZXdhcmUocmVxOiBSZXE8Vj4sIHJlczogUmVzPFY+KSB7XHJcbiAgICAgICAgc2VuZEZpbGUocmVxdWlyZS5yZXNvbHZlKHBvc2l4LmpvaW4oXCJlc25leHQtc2VydmVyLWNsaWVudC9kaXN0L2luZGV4LmpzXCIpKSwgcmVzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNlbmRGaWxlPFY+KGZpbGVuYW1lOiBzdHJpbmcsIHJlczogViBleHRlbmRzIFJvdXRlci5IVFRQVmVyc2lvbi5WMSA/IFNlcnZlclJlc3BvbnNlIDogSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xyXG4gICAgICAgIHJlYWRGaWxlKGZpbGVuYW1lLCAoZXJyLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoSHR0cFN0YXR1cy5OT1RfRk9VTkQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChIdHRwU3RhdHVzLk9LLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogY29udGVudFR5cGUoZmlsZW5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT04NjQwMCwgaW1tdXRhYmxlXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIF9fICAgICAgICBfXyAgICAgICAgIF8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX19fX1xyXG4gICAgICogIFxcIFxcICAgICAgLyAvX18gIF8gX198IHwgX19fX18gXyBfXyAgIF9fIF8gIF9fXyBfX18gIHwgIF8gXFwgX19fICBfX18gIF9fXyAgXyAgIF8gXyBfXyBfX18gX19fICBfX19cclxuICAgICAqICAgXFwgXFwgL1xcIC8gLyBfIFxcfCAnX198IHwvIC8gX198ICdfIFxcIC8gX2AgfC8gX18vIF8gXFwgfCB8XykgLyBfIFxcLyBfX3wvIF8gXFx8IHwgfCB8ICdfXy8gX18vIF8gXFwvIF9ffFxyXG4gICAgICogICAgXFwgViAgViAvIChfKSB8IHwgIHwgICA8XFxfXyBcXCB8XykgfCAoX3wgfCAoX3wgIF9fLyB8ICBfIDwgIF9fL1xcX18gXFwgKF8pIHwgfF98IHwgfCB8IChffCAgX18vXFxfXyBcXFxyXG4gICAgICogICAgIFxcXy9cXF8vIFxcX19fL3xffCAgfF98XFxfXFxfX18vIC5fXy8gXFxfXyxffFxcX19fXFxfX198IHxffCBcXF9cXF9fX3x8X19fL1xcX19fLyBcXF9fLF98X3wgIFxcX19fXFxfX198fF9fXy9cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxffFxyXG4gICAgICovXHJcbiAgICByb3V0ZXIuZ2V0KFwiLypcIiwgYXN5bmMgZnVuY3Rpb24gd29ya3NwYWNlTWlkZGxld2FyZShyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pIHtcclxuXHJcbiAgICAgICAgaWYgKHJlcS51cmwpIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgcHJvdmlkZVJlc291cmNlKHJlcS51cmwpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc291cmNlLmxpbmtzICYmIG9wdGlvbnMuaHR0cDIgPT09IFwicHJlbG9hZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzLmxpbmsgPSByZXNvdXJjZS5saW5rcy5tYXAobGluayA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvdmlkZVJlc291cmNlKGxpbmspLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oXCJmYWlsZWQgdG8gcHJlLXdhcm0gY2FjaGUgd2l0aDpcIiwgbGluayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8JHtsaW5rfT47IGNyb3Nzb3JpZ2luOyByZWw9cHJlbG9hZDsgYXM9JHtsaW5rLmVuZHNXaXRoKFwiLmNzc1wiKSA/IFwic3R5bGVcIiA6IFwic2NyaXB0XCJ9YDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgcmVzb3VyY2UuaGVhZGVycyk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UubGlua3MgJiYgb3B0aW9ucy5odHRwMiA9PT0gXCJwdXNoXCIgJiYgcmVzIGluc3RhbmNlb2YgSHR0cDJTZXJ2ZXJSZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgaHR0cDJQdXNoKHJlcy5zdHJlYW0sIHJlc291cmNlLnBhdGhuYW1lLCByZXNvdXJjZS5saW5rcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy5lbmQocmVzb3VyY2UuY29udGVudCk7XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHtjb2RlLCBoZWFkZXJzID0ge30sIG1lc3NhZ2UsIHN0YWNrfSA9IGVycm9yO1xyXG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBIdHRwU3RhdHVzLklOVEVSTkFMX1NFUlZFUl9FUlJPUjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3JgJHtjb2RlfSAnJHt0ZXh0fScgaGFuZGxpbmc6ICR7cmVxLnVybH1gO1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoY29kZSwgaGVhZGVycyk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKHN0YWNrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBIdHRwU3RhdHVzLmdldFN0YXR1c1RleHQoY29kZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMzA4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogY2hlY2sgcGVybWFuZW50IHJlZGlyZWN0IGJlaGF2aW91clxyXG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuYCR7Y29kZX0gJyR7dGV4dH0nICR7cmVxLnVybH0gLT4gJHtoZWFkZXJzLmxvY2F0aW9ufWA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcmAke2NvZGV9ICcke3RleHR9JyAke21lc3NhZ2UgfHwgXCJoYW5kbGluZzogXCIgKyByZXEudXJsfWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKGNvZGUsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICAgX19fXyAgICAgICAgICAgICAgICAgICAgICBfX18gICAgICAgXyAgICAgICBfICAgICAgICAgX18gIF9fIF8gICAgIF8gICAgIF8gX1xyXG4gICAgICogICAvIF9fX3xfIF9fIF9fXyAgX19fIF9fXyAgIC8gXyBcXCBfIF9fKF8pIF9fIF8oXylfIF9fICAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fX1xyXG4gICAgICogIHwgfCAgIHwgJ19fLyBfIFxcLyBfXy8gX198IHwgfCB8IHwgJ19ffCB8LyBfYCB8IHwgJ18gXFwgIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxyXG4gICAgICogIHwgfF9fX3wgfCB8IChfKSBcXF9fIFxcX18gXFwgfCB8X3wgfCB8ICB8IHwgKF98IHwgfCB8IHwgfCB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xyXG4gICAgICogICBcXF9fX198X3wgIFxcX19fL3xfX18vX19fLyAgXFxfX18vfF98ICB8X3xcXF9fLCB8X3xffCB8X3wgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fXy9cclxuICAgICAqL1xyXG4gICAgY29uc3QgY29ycyA9IGNvcnNNaWRkbGV3YXJlKG9wdGlvbnMuY29ycyk7XHJcblxyXG4gICAgY29uc3QgbmV4dCA9IChyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pID0+IGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb3V0ZXIubG9va3VwKHJlcSwgcmVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiByZXF1ZXN0SGFuZGxlcihyZXE6IFJlcTxWPiwgcmVzOiBSZXM8Vj4pOiB2b2lkIHtcclxuICAgICAgICBsb2cuZGVidWcocmVxLm1ldGhvZCEsIHJlcS51cmwpO1xyXG4gICAgICAgIGNvcnMocmVxLCByZXMsIG5leHQocmVxLCByZXMpKTtcclxuICAgIH07XHJcbn0pO1xyXG4iXX0=