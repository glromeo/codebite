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
        res.writeHead(http_status_codes_1.default.OK, {
            "content-type": mime_types_1.contentType(filename),
            "cache-control": "public, max-age=86400, immutable"
        });
        fs_1.createReadStream(filename).pipe(res);
    });
    /**
     *  __        __         _                               ____
     *  \ \      / /__  _ __| | _____ _ __   __ _  ___ ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *   \ \ /\ / / _ \| '__| |/ / __| '_ \ / _` |/ __/ _ \ | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *    \ V  V / (_) | |  |   <\__ \ |_) | (_| | (_|  __/ |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *     \_/\_/ \___/|_|  |_|\_\___/ .__/ \__,_|\___\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *                               |_|
     */
    router.get("/*", async function workspaceMiddleware(req, res) {
        try {
            const { pathname, content, headers, links } = await provideResource(req.url, req.headers);
            req.on("error", tiny_node_logger_1.default.error);
            res.on("error", tiny_node_logger_1.default.error);
            if (links && options.http2 === "push" && res instanceof http2_1.Http2ServerResponse) {
                res.writeHead(200, headers);
                http2Push(res.stream, pathname, links, req.headers);
                res.end(content);
                return;
            }
            if (links && options.http2 === "preload") {
                headers.link = [...links].map(link => {
                    return `<${link}>; crossorigin; rel=preload; as=${link.endsWith(".css") ? "style" : "script"}`;
                });
            }
            res.writeHead(200, headers);
            res.end(content);
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
//# sourceMappingURL=request-handler.js.map