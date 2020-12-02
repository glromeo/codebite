const log = require("tiny-node-logger");
const {memoize} = require("esnext-server-extras");
const http2 = require("http2");
const HttpStatus = require("http-status-codes");
const path = require("path");
const {useResourceProvider} = require("../providers/resource-provider.js");
const {toPosix} = require("esnext-server-extras");

const {
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_METHOD,
    HTTP2_METHOD_CONNECT,
    NGHTTP2_REFUSED_STREAM
} = http2.constants;

module.exports.useHttp2Push = memoize((config, watcher) => {

    const {provideResource} = useResourceProvider(config, watcher);

    const serverPush = (stream, url, clientHeaders) => new Promise(async (resolve, reject) => {
        try {
            const {
                content,
                headers
            } = await provideResource(url, clientHeaders);

            stream.pushStream({
                [HTTP2_HEADER_PATH]: url,
                [HTTP2_HEADER_METHOD]: HTTP2_METHOD_CONNECT
            }, function (err, push) {
                if (err) {
                    reject(err);
                } else {
                    push.on("close", resolve);

                    push.on("error", function (err) {
                        if (push.rstCode === NGHTTP2_REFUSED_STREAM) {
                            log.debug("NGHTTP2_REFUSED_STREAM", url);
                        } else if (err.code === "ERR_HTTP2_STREAM_ERROR") {
                            log.warn("ERR_HTTP2_STREAM_ERROR", url);
                        } else {
                            log.error(err.code, url, err.message);
                        }
                    });

                    const response = {
                        ":status": HttpStatus.OK
                    };

                    if (headers) for (const name of Object.keys(headers)) {
                        response[name.toLowerCase()] = headers[name];
                    }

                    push.respond(response);
                    push.end(content);
                }
            });

        } catch (error) {
            reject(error);
        }
    });

    async function http2Push(stream, pathname, links, clientHeaders) {
        if (stream) {
            const dirname = path.posix.dirname(pathname);
            for (let link of links) {
                const url = link.startsWith("/") ? link : path.posix.resolve(dirname, link);
                if (stream.pushAllowed) {
                    await serverPush(stream, url, clientHeaders).catch(error => {
                        log.warn("internal error pushing:", link, "from:", pathname);
                    });
                } else {
                    log.warn("not allowed to push:", link, "from:", pathname);
                }
            }
        }
    }

    return {
        http2Push
    };
});
