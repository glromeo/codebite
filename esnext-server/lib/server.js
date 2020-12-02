const log = require("tiny-node-logger");
const {createWebSockets} = require("./websockets.js");

const {createWatcher} = require("./watcher.js");
const {createRequestHandler} = require("./request-handler.js");
const {contentText} = require("./util/content-utils.js");

module.exports.startServer = async function (config = require("../es-next-server.config.js"), prototype = {}) {

    const {
        server: {
            protocol,
            host,
            port,
            options = {}
        },
        http2
    } = config;

    const watcher = prototype.watcher || createWatcher(config);
    const handler = prototype.handler || createRequestHandler(config, watcher);

    let module, server;

    if (http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer(options, handler);
        } else {
            server = module.createSecureServer(options, handler);
        }
    } else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(options, handler);
        } else {
            module = require("https");
            server = module.createServer(options, handler);
        }
    }

    const sockets = new Set();

    server.on("connection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });

    const onExit = [];

    onExit.push(function closeWatcher() {
        log.debug(`closing chokidar watcher...`);
        return watcher.close();
    });

    onExit.push(function destroyPendingSockets() {
        if (sockets.size > 0) {
            log.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }
    });

    server.shutdown = async function () {

        const closed = new Promise(resolve => {
            server.on("close", resolve);
        }).then(() => {
            log.info("server closed");
        });

        server.shutdown = async function () {
            await closed;
            log.debug("server already closed");
        };

        await Promise.all(onExit.map(cb => cb()));
        server.close();
        return closed;
    };

    await new Promise(resolve => server.listen(port, host, resolve));

    const address = `${protocol}://${host}:${port}`;
    log.info(`server started on ${address}`);

    createWebSockets(config, server, watcher);

    return {
        config,
        module,
        server,
        watcher,
        handler,
        address
    };
};
