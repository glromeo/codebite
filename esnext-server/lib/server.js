"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.DEFAULT_SERVER_OPTIONS = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const request_handler_1 = require("./request-handler");
const watcher_1 = require("./watcher");
const websockets_1 = require("./websockets");
exports.DEFAULT_SERVER_OPTIONS = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    options: {}
};
async function startServer(options, services = {}) {
    const { server: { protocol, host, port, options: serverOptions = {} } = exports.DEFAULT_SERVER_OPTIONS } = options;
    const watcher = services.watcher || watcher_1.createWatcher(options);
    const handler = services.handler || request_handler_1.createRequestHandler(options, watcher);
    let module, server;
    if (options.http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer(serverOptions, handler);
        }
        else {
            server = module.createSecureServer(serverOptions, handler);
        }
    }
    else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(serverOptions, handler);
        }
        else {
            module = require("https");
            server = module.createServer(serverOptions, handler);
        }
    }
    await new Promise(resolve => server.listen(port, host, resolve));
    const address = `${protocol}://${host}:${port}`;
    tiny_node_logger_1.default.info(`server started on ${address}`);
    websockets_1.createWebSockets(options, server, watcher);
    const sockets = new Set();
    server.on("connection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });
    let closed;
    async function shutdown() {
        if (closed) {
            tiny_node_logger_1.default.debug("server already closed");
            await closed;
        }
        closed = new Promise(resolve => server.on("close", resolve));
        if (sockets.size > 0) {
            tiny_node_logger_1.default.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }
        tiny_node_logger_1.default.debug(`closing chokidar watcher...`);
        await watcher.close();
        server.close();
        await closed;
        tiny_node_logger_1.default.info("server closed");
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
exports.startServer = startServer;
//# sourceMappingURL=server.js.map