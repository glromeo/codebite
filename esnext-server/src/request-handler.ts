import {FSWatcher} from "chokidar";
import corsMiddleware from "cors";
import {parse as parseURL} from "fast-url-parser";
import Router, {Req, Res} from "find-my-way";
import {createReadStream} from "fs";
import HttpStatus from "http-status-codes";
import {Http2ServerResponse} from "http2";
import {join} from "path";
import {Writable} from "stream";
import log from "tiny-node-logger";
import {ESNextOptions} from "./configure";
import {useResourceProvider} from "./providers/resource-provider";
import {createRouter} from "./router";
import {useHttp2Push} from "./util/http2-push";
import {contentType} from "./util/mime-types";

export function createRequestHandler<V extends Router.HTTPVersion = Router.HTTPVersion.V1>(options: ESNextOptions, watcher: FSWatcher) {

    const {provideResource} = useResourceProvider(options, watcher);
    const {http2Push} = useHttp2Push(options, watcher);

    const router = createRouter<V>(options, watcher);

    /**
     *   ____  _        _   _        ____
     *  / ___|| |_ __ _| |_(_) ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *  \___ \| __/ _` | __| |/ __| | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *   ___) | || (_| | |_| | (__  |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *  |____/ \__\__,_|\__|_|\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *
     */
    router.get("/resources/*", function resourcesMiddleware(req: Req<V>, res: Res<V>) {
        const {pathname} = parseURL(req.url);
        const filename = join(options.resources, pathname.substring(10));
        res.writeHead(HttpStatus.OK, {
            "content-type": contentType(filename),
            "cache-control": "public, max-age=86400, immutable"
        });
        createReadStream(filename).pipe(res as Writable);
    });

    /**
     *  __        __         _                               ____
     *  \ \      / /__  _ __| | _____ _ __   __ _  ___ ___  |  _ \ ___  ___  ___  _   _ _ __ ___ ___  ___
     *   \ \ /\ / / _ \| '__| |/ / __| '_ \ / _` |/ __/ _ \ | |_) / _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
     *    \ V  V / (_) | |  |   <\__ \ |_) | (_| | (_|  __/ |  _ <  __/\__ \ (_) | |_| | | | (_|  __/\__ \
     *     \_/\_/ \___/|_|  |_|\_\___/ .__/ \__,_|\___\___| |_| \_\___||___/\___/ \__,_|_|  \___\___||___/
     *                               |_|
     */
    router.get("/*", async function workspaceMiddleware(req: Req<V>, res: Res<V>) {

        log.debug(req.method!, req.url);
        try {
            const {
                pathname,
                content,
                headers,
                links
            } = await provideResource(req.url, req.headers);

            if (res instanceof Http2ServerResponse) {
                if (links && options.http2 === "push") {
                    res.writeHead(200, headers);
                    res.write(content);
                    await http2Push(res.stream, pathname, links, req.headers);
                    res.end();
                    return;
                }
                if (links && options.http2 === "preload") {
                    res.setHeader("link", [...links].map(
                        src => `<${src}>; rel=preload; as=${src.endsWith(".css") ? "style" : "script"}`
                    ));
                }
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

    /**
     *    ____                      ___       _       _         __  __ _     _     _ _
     *   / ___|_ __ ___  ___ ___   / _ \ _ __(_) __ _(_)_ __   |  \/  (_) __| | __| | | _____      ____ _ _ __ ___
     *  | |   | '__/ _ \/ __/ __| | | | | '__| |/ _` | | '_ \  | |\/| | |/ _` |/ _` | |/ _ \ \ /\ / / _` | '__/ _ \
     *  | |___| | | (_) \__ \__ \ | |_| | |  | | (_| | | | | | | |  | | | (_| | (_| | |  __/\ V  V / (_| | | |  __/
     *   \____|_|  \___/|___/___/  \___/|_|  |_|\__, |_|_| |_| |_|  |_|_|\__,_|\__,_|_|\___| \_/\_/ \__,_|_|  \___|
     *                                          |___/
     */
    const cors = corsMiddleware(options.cors);

    const next = (req: Req<V>, res: Res<V>) => function (err) {
        if (err) {
            throw err;
        } else {
            router.lookup(req, res);
        }
    };

    return function requestHandler(req: Req<V>, res: Res<V>): void {
        cors(req, res, next(req, res));
    };
}
