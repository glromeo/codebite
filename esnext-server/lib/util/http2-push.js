"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHttp2Push = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const http2_1 = __importDefault(require("http2"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const resource_provider_1 = require("../providers/resource-provider");
exports.useHttp2Push = nano_memoize_1.default((options, watcher) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options, watcher);
    const { HTTP2_HEADER_PATH, NGHTTP2_REFUSED_STREAM } = http2_1.default.constants;
    function http2Push(stream, pathname, links, clientHeaders) {
        const dirname = path_1.default.posix.dirname(pathname);
        for (const link of links) {
            const url = link.startsWith("/") ? link : path_1.default.posix.resolve(dirname, link);
            provideResource(url, clientHeaders).then(resource => {
                if (stream.destroyed) {
                    return;
                }
                if (!stream.pushAllowed) {
                    tiny_node_logger_1.default.debug("not allowed pushing from:", pathname);
                    return;
                }
                stream.pushStream({ [HTTP2_HEADER_PATH]: url }, function (err, push) {
                    if (err) {
                        tiny_node_logger_1.default.warn("cannot push stream for:", link, "from:", pathname, err);
                        return;
                    }
                    push.on("error", function (err) {
                        if (push.rstCode === NGHTTP2_REFUSED_STREAM) {
                            tiny_node_logger_1.default.debug("NGHTTP2_REFUSED_STREAM", url);
                        }
                        else if (err.code === "ERR_HTTP2_STREAM_ERROR") {
                            tiny_node_logger_1.default.warn("ERR_HTTP2_STREAM_ERROR", url);
                        }
                        else {
                            tiny_node_logger_1.default.error(err.code, url, err.message);
                        }
                    });
                    if (!push.destroyed) {
                        push.respond({
                            ...resource.headers,
                            ":status": http_status_codes_1.default.OK
                        });
                        push.end(resource.content);
                    }
                });
            }).catch(err => {
                tiny_node_logger_1.default.warn("error pushing:", link, "from:", pathname, err);
            });
        }
    }
    return {
        http2Push
    };
});
//# sourceMappingURL=http2-push.js.map