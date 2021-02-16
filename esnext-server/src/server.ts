import {FSWatcher} from "chokidar";
import Router, {Handler, HTTPVersion} from "find-my-way";
import {Server as HttpServer} from "http";
import {Http2Server} from "http2";
import {Server as HttpsServer} from "https";
import {Socket} from "net";
import log from "tiny-node-logger";
import {ESNextOptions} from "./configure";
import {createRequestHandler} from "./request-handler";
import {createWatcher} from "./watcher";
import {createWebSockets} from "./websockets";
import {EsmHmrEngine, useHotModuleReplacement} from "./hmr-server";

export type ServerOptions = {
    protocol?: "http" | "https"
    host?: string
    port?: number
    options?: {
        key?: string
        cert?: string
        allowHTTP1?: boolean
    }
}

export const DEFAULT_SERVER_OPTIONS: ServerOptions = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    options: {}
};

export type Services = {
    watcher?: FSWatcher
    handler?: Handler<HTTPVersion.V1|HTTPVersion.V2>
}

export async function startServer(options: ESNextOptions, services: Services = {}) {

    const {
        server: {
            protocol,
            host,
            port,
            options: serverOptions = {}
        } = DEFAULT_SERVER_OPTIONS
    } = options;

    const watcher = services.watcher || createWatcher(options);
    const handler = services.handler || createRequestHandler(options, watcher);

    let module, server: HttpServer | HttpsServer | Http2Server;

    if (options.http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer(serverOptions, handler);
        } else {
            server = module.createSecureServer(serverOptions, handler);
        }
    } else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(serverOptions, handler);
        } else {
            module = require("https");
            server = module.createServer(serverOptions, handler);
        }
    }

    await new Promise<void>(resolve => server.listen(port, host, resolve));

    const address = `${protocol}://${host}:${port}`;
    log.info(`server started on ${address}`);

    useHotModuleReplacement(options).connect(server);

    createWebSockets(options, server, watcher);

    const sockets = new Set<Socket>();

    server.on("connection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });
    server.on("secureConnection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });

    let closed;

    async function shutdown(this: any) {
        if (closed) {
            log.debug("server already closed");
            await closed;
        }

        closed = new Promise(resolve => server.on("close", resolve));

        if (sockets.size > 0) {
            log.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }

        log.debug(`closing chokidar watcher...`);
        await watcher.close();

        server.close();
        await closed;
        log.info("server closed");

        return closed;
    }

    return {
        config: options,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
