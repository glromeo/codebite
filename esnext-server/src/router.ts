import Router, {HTTPVersion} from "find-my-way";
import Server from "http-proxy";
import {ESNextOptions} from "./configure";

export function createRouter(options: ESNextOptions, watcher) {

    const router = Router<HTTPVersion.V2>({
        onBadUrl: (path, req, res) => {
            res.statusCode = 400;
            res.end(`Malformed URL: ${path}`);
        },
        ...options.router
    });

    options.middleware.forEach(middleware => middleware(router, options, watcher));

    if (options.proxy) {
        for (const [path, serverOptions] of Object.entries(options.proxy)) {
            const proxy = Server.createProxyServer(serverOptions);
            // @ts-ignore Note that this is a problem because HTTP-PROXY doesn't support HTTP2 headers!
            router.all(path, proxy.web.bind(proxy));
        }
    }

    return router;
}
