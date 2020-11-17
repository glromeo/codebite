const log = require("@codebite/logger");

const WebSocket = require("ws");

const {magenta, underline} = require("chalk");
const {resolve, dirname} = require("path");
const {existsSync} = require("fs");

const WS_CONFIG_FILE = "websockets.config.js";

module.exports.createWebSockets = function (config, server, watcher) {

    // todo: maybe we can refactor this to use a pathname for each workspace
    const wss = new WebSocket.Server({server});

    const listeners = new Map();

    function on(name, listener) {
        listeners.set(name, listener);
        log.debug("added message listener:", magenta(name));
    }

    watcher.on("all", async function (event, path) {

        if (path.endsWith(WS_CONFIG_FILE)) {
            const module = resolve(config.rootDir, path);
            const context = {
                dirname: dirname(module),
                filename: module
            };

            delete require.cache[require.resolve(module)];

            log.info("websockets :", underline(module));
            require(module).call(context, config, watcher, on);
        }
    });

    for (const basedir of Object.values(config.mount)) {
        const filename = resolve(config.rootDir, basedir, WS_CONFIG_FILE);
        if (existsSync(filename)) {
            watcher.add(filename);
        }
    }

    function marshall(header, payload) {
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

    wss.on("connection", ws => {

        ws.on("message", message => {
            const {header, payload} = unmarshall(message);
            const listener = listeners.get(header);
            if (listener) {
                listener.call(listeners, payload, (header, payload) => ws.send(marshall(header, payload)));
            }
        });

        ws.send("connected:" + JSON.stringify({since: new Date().toUTCString()}));
    });
};
