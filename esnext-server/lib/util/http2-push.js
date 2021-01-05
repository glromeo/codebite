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
const { HTTP2_HEADER_PATH, HTTP2_HEADER_METHOD, HTTP2_METHOD_CONNECT, NGHTTP2_REFUSED_STREAM } = http2_1.default.constants;
exports.useHttp2Push = nano_memoize_1.default((options, watcher) => {
    const { provideResource } = resource_provider_1.useResourceProvider(options, watcher);
    const serverPush = (stream, url, clientHeaders) => new Promise(async (resolve, reject) => {
        try {
            const { content, headers } = await provideResource(url, clientHeaders);
            stream.pushStream({
                [HTTP2_HEADER_PATH]: url,
                [HTTP2_HEADER_METHOD]: HTTP2_METHOD_CONNECT
            }, function (err, push) {
                if (err) {
                    reject(err);
                }
                else {
                    push.on("close", resolve);
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
                    const response = {
                        ":status": http_status_codes_1.default.OK
                    };
                    if (headers)
                        for (const name of Object.keys(headers)) {
                            response[name.toLowerCase()] = headers[name];
                        }
                    push.respond(response);
                    push.end(content);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
    async function http2Push(stream, pathname, links, clientHeaders) {
        if (stream) {
            const dirname = path_1.default.posix.dirname(pathname);
            for (let link of links) {
                const url = link.startsWith("/") ? link : path_1.default.posix.resolve(dirname, link);
                if (stream.pushAllowed) {
                    await serverPush(stream, url, clientHeaders).catch(error => {
                        tiny_node_logger_1.default.warn("internal error pushing:", link, "from:", pathname);
                    });
                }
                else {
                    tiny_node_logger_1.default.warn("not allowed to push:", link, "from:", pathname);
                }
            }
        }
    }
    return {
        http2Push
    };
});
//# sourceMappingURL=http2-push.js.map