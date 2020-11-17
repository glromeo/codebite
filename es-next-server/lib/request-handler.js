const log = require("@codebite/logger");

const HttpStatus = require("http-status-codes");
const corsMiddleware = require("cors");
const {createRouter} = require("./router.js");
const {useResourceProvider} = require("./providers/resource-provider.js");
const {useHttp2Push} = require("./util/http2-push.js");
const {contentType} = require("@codebite/utility");

module.exports.createRequestHandler = (config = require("../es-next-server.config.js"), watcher) => {

    const {provideResource} = useResourceProvider(config, watcher);
    const {http2Push} = useHttp2Push(config, watcher);

    const router = createRouter(config);

    const {createReadStream} = require("fs");
    const {join} = require("path");
    const {parse: parseURL} = require("fast-url-parser");

    router.get("/resources/*", (req, res) => {
        const {pathname} = parseURL(req.url);
        const filename = join(config.resources, pathname.substring(10));
        res.writeHead(HttpStatus.OK, {
            "content-type": contentType(filename),
            "cache-control": "public, max-age=86400, immutable"
        });
        createReadStream(filename).pipe(res);
    });

    router.get("/*", async (req, res) => {

        log.debug(req.method, req.url);

        try {
            const {
                pathname,
                content,
                headers,
                links
            } = await provideResource(req.url, req.headers);

            if (links && config.http2 === "push") {
                res.writeHead(200, headers);
                res.write(content);
                await http2Push(res.stream, pathname, links, req.headers);
                res.end();
                return;
            }

            if (links && config.http2 === "preload") {
                res.setHeader("link", [...links].map(
                    src => `<${src}>; rel=preload; as=${src.endsWith(".css") ? "style" : "script"}`
                ));
            }

            res.writeHead(200, headers);
            res.end(content);

        } catch (error) {
            const {code, headers = {}, message, stack} = error;
            if (stack) {
                const code = HttpStatus.INTERNAL_SERVER_ERROR;
                const text = HttpStatus.getStatusText(code);
                log.error`${code} '${text}' handling: ${req.url}`;
                log.error(error);
                res.writeHead(code, headers);
                res.end(stack);
            } else {
                const text = HttpStatus.getStatusText(code);
                if (code === 308) {
                    // todo: check permanent redirect behaviour
                    log.warn`${code} '${text}' ${req.url} -> ${headers.location}`;
                } else {
                    log.error`${code} '${text}' ${message || "handling: " + req.url}`;
                }
                res.writeHead(code, headers);
                res.end(message);
            }
        }
    });

    const cors = corsMiddleware(config.cors);
    const next = (req, res) => function (err) {
        if (err) {
            throw err;
        } else {
            router.lookup(req, res);
        }
    };

    return function handler(req, res) {
        cors(req, res, next(req, res));
    };
};
