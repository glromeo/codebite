"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = void 0;
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = require("http2");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("./providers/resource-provider");
const router_1 = require("./router");
const http2_push_1 = require("./util/http2-push");
const mime_types_1 = require("./util/mime-types");
function createRequestHandler(options, watcher) {
    const { provideResource } = resource_provider_1.useResourceProvider(options, watcher);
    const { http2Push } = http2_push_1.useHttp2Push(options, watcher);
    const router = router_1.createRouter(options, watcher);
    const { createReadStream } = require("fs");
    const { join } = require("path");
    const { parse: parseURL } = require("fast-url-parser");
    router.get("/resources/*", (req, res) => {
        const { pathname } = parseURL(req.url);
        const filename = join(options.resources, pathname.substring(10));
        res.writeHead(http_status_codes_1.default.OK, {
            "content-type": mime_types_1.contentType(filename),
            "cache-control": "public, max-age=86400, immutable"
        });
        createReadStream(filename).pipe(res);
    });
    router.get("/*", async (req, res) => {
        tiny_node_logger_1.default.debug(req.method, req.url);
        try {
            const { pathname, content, headers, links } = await provideResource(req.url, req.headers);
            if (res instanceof http2_1.Http2ServerResponse) {
                if (links && options.http2 === "push") {
                    res.writeHead(200, headers);
                    res.write(content);
                    await http2Push(res.stream, pathname, links, req.headers);
                    res.end();
                    return;
                }
                if (links && options.http2 === "preload") {
                    res.setHeader("link", [...links].map(src => `<${src}>; rel=preload; as=${src.endsWith(".css") ? "style" : "script"}`));
                }
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
    const cors = cors_1.default(options.cors);
    const next = (req, res) => function (err) {
        if (err) {
            throw err;
        }
        else {
            router.lookup(req, res);
        }
    };
    return function handler(req, res) {
        cors(req, res, next(req, res));
    };
}
exports.createRequestHandler = createRequestHandler;
//# sourceMappingURL=request-handler.js.map