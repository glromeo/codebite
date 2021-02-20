import chalk from "chalk";
import {existsSync} from "fs";
import {dirname, resolve} from "path";
import log from "tiny-node-logger";
import WebSocket from "ws";
import {useWebModules, notifications, WebModulesNotification} from "esnext-web-modules";

const WS_CONFIG_FILE = "websockets.config.js";

export function createWebSockets(config, server, watcher) {

    const wss = new WebSocket.Server({noServer: true});

    server.on("upgrade", (req, socket, head) => {
        if (req.headers["sec-websocket-protocol"] !== "esm-hmr") {
            wss.handleUpgrade(req, socket, head, (client) => {
                wss.emit("connection", client, req);
            });
        }
    });

    const listeners = new Map();

    function on(name, listener) {
        listeners.set(name, listener);
        log.debug("added message listener:", chalk.magenta(name));
    }

    watcher.on("all", async function (event, path) {

        if (path.endsWith(WS_CONFIG_FILE)) {
            const module = resolve(config.rootDir, path);
            const context = {
                dirname: dirname(module),
                filename: module
            };

            delete require.cache[require.resolve(module)];

            log.info("websockets:", chalk.underline(module));
            require(module).call(context, config, watcher, on);
        }
    });

    for (const basedir of Object.values<string>(config.mount)) {
        const filename = resolve(config.rootDir, basedir, WS_CONFIG_FILE);
        if (existsSync(filename)) {
            watcher.add(filename);
        }
    }

    function marshall(header:string, payload:any) {
        return payload ? `${header}:${JSON.stringify(payload)}` : header;
    }

    function unmarshall(message) {
        const sep = message.indexOf(":");
        let header, payload;
        if (sep !== -1) {
            header = message.substring(0, sep);
            payload = JSON.parse(message.substring(sep + 1));
        } else {
            header = message;
        }
        log.debug("ws:", header, message.length < 250 ? payload : `{...}`);
        return {header, payload};
    }

    const clients = new Set<WebSocket>();

    wss.on("connection", ws => {

        ws.on("message", message => {
            const {header, payload} = unmarshall(message);
            const listener = listeners.get(header);
            if (listener) {
                listener.call(listeners, payload, (header, payload) => ws.send(marshall(header, payload)));
            }
        });

        ws.send("connected:" + JSON.stringify({since: new Date().toUTCString()}));

        clients.add(ws);

        ws.on("close", function () {
            clients.delete(ws);
        });
    });

    function broadcast(header:string, payload:any) {
        let message = marshall(header, payload);
        for (const client of clients) {
            client.send(message);
        }
    }

    notifications.on("new", (notification:WebModulesNotification) => {
        broadcast("notification:new", notification);
    });

    notifications.on("update", (notification:WebModulesNotification) => {
        broadcast("notification:update", notification);
    });
}
