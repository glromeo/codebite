import chalk from "chalk";
import log from "tiny-node-logger";
import WebSocket from "ws";
import memoize from "pico-memoize";
import {ESNextOptions} from "./configure";
import {MultiMap} from "./util/multi-map";
import {useWatcher} from "./watcher";
import {FSWatcher} from "chokidar";
import {notifications, WebModulesNotification} from "esnext-web-modules";

export type BackboneOptions = {
    plugins?: ((options: ESNextOptions, watcher: FSWatcher) => BackbonePlugin)[]
}

export interface BackbonePlugin {
    [event: string]: <I, O>(payload: I, send: (header: string, payload: O) => void) => void
}

export const useBackbone = memoize((options: ESNextOptions) => {

    const watcher = useWatcher(options);

    const plugins = new MultiMap<string, BackbonePlugin>();

    for (const createPlugin of options.backbone?.plugins ?? []) {
        const plugin = createPlugin(options, watcher);
        const methods = Object.getOwnPropertyNames(plugin);
        for (const method of methods) {
            plugins.add(method, plugin);
            log.debug("added message listener for:", chalk.magenta(method));
        }
    }

    function marshall(header: string, payload: any) {
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

    function broadcast(header: string, payload: any) {
        let message = marshall(header, payload);
        for (const client of clients) {
            client.send(message);
        }
    }

    function onConnection(client: WebSocket) {

        log.debug("client connected:", client.url);
        clients.add(client);

        client.on("close", () => {
            log.debug("client disconnected:", client.url);
            clients.delete(client)
        });

        function respond(header, payload) {
            return client.send(marshall(header, payload));
        }

        client.on("message", message => {
            const {header, payload} = unmarshall(message);
            if (plugins.has(header)) for (const plugin of plugins.get(header)!) {
                plugin[header](payload, respond);
            }
        });

        client.send("connected:" + JSON.stringify({since: new Date().toUTCString()}));
    }

    notifications.on("new", (notification: WebModulesNotification) => {
        broadcast("notification:new", notification);
    });

    notifications.on("update", (notification: WebModulesNotification) => {
        broadcast("notification:update", notification);
    });

    return {
        handleUpgrade(req, socket, head) {
            if (req.headers["sec-websocket-protocol"] !== "esm-hmr") {
                const wss = new WebSocket.Server({noServer: true});
                wss.on("connection", onConnection);
                wss.on("error", function (error) {
                    log.error("backbone error:", error);
                });
                wss.on("close", function () {
                    log.info("backbone closed");
                });
                wss.handleUpgrade(req, socket, head, (client) => {
                    wss.emit("connection", client, req);
                });
                log.info("backbone ready");
            }
        },
        broadcast
    }
});
