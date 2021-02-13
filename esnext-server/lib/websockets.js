"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSockets = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path_1 = require("path");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const ws_1 = __importDefault(require("ws"));
const WS_CONFIG_FILE = "websockets.config.js";
function createWebSockets(config, server, watcher) {
    // todo: maybe we can refactor this to use a pathname for each workspace
    const wss = new ws_1.default.Server({ server });
    const listeners = new Map();
    function on(name, listener) {
        listeners.set(name, listener);
        tiny_node_logger_1.default.debug("added message listener:", chalk_1.default.magenta(name));
    }
    watcher.on("all", async function (event, path) {
        if (path.endsWith(WS_CONFIG_FILE)) {
            const module = path_1.resolve(config.rootDir, path);
            const context = {
                dirname: path_1.dirname(module),
                filename: module
            };
            delete require.cache[require.resolve(module)];
            tiny_node_logger_1.default.info("websockets :", chalk_1.default.underline(module));
            require(module).call(context, config, watcher, on);
        }
    });
    for (const basedir of Object.values(config.mount)) {
        const filename = path_1.resolve(config.rootDir, basedir, WS_CONFIG_FILE);
        if (fs_1.existsSync(filename)) {
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
        }
        else {
            header = message;
        }
        tiny_node_logger_1.default.debug("ws:", header, message.length < 250 ? payload : `{...}`);
        return { header, payload };
    }
    wss.on("connection", ws => {
        ws.on("message", message => {
            const { header, payload } = unmarshall(message);
            const listener = listeners.get(header);
            if (listener) {
                listener.call(listeners, payload, (header, payload) => ws.send(marshall(header, payload)));
            }
        });
        ws.send("connected:" + JSON.stringify({ since: new Date().toUTCString() }));
    });
}
exports.createWebSockets = createWebSockets;
//# sourceMappingURL=websockets.js.map