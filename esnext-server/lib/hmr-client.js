"use strict";
/**
 * esm-hmr/client.ts
 * A client-side implementation of the ESM-HMR spec, for reference.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHotContext = void 0;
function debug(...args) {
    console.log("[ESM-HMR]", ...args);
}
function reload() {
    location.reload(true);
}
let SOCKET_MESSAGE_QUEUE = [];
function _sendSocketMessage(msg) {
    socket.send(JSON.stringify(msg));
}
function sendSocketMessage(msg) {
    if (socket.readyState !== socket.OPEN) {
        SOCKET_MESSAGE_QUEUE.push(msg);
    }
    else {
        _sendSocketMessage(msg);
    }
}
const socketURL = window.HMR_WEBSOCKET_URL ||
    (location.protocol === "http:" ? "ws://" : "wss://") + location.host + "/";
const socket = new WebSocket(socketURL, "esm-hmr");
socket.addEventListener("open", () => {
    SOCKET_MESSAGE_QUEUE.forEach(_sendSocketMessage);
    SOCKET_MESSAGE_QUEUE = [];
});
const REGISTERED_MODULES = {};
class HotModuleState {
    constructor(id) {
        this.data = {};
        this.isLocked = false;
        this.isDeclined = false;
        this.isAccepted = false;
        this.acceptCallbacks = [];
        this.disposeCallbacks = [];
        this.id = id;
    }
    lock() {
        this.isLocked = true;
    }
    dispose(callback) {
        this.disposeCallbacks.push(callback);
    }
    invalidate() {
        reload();
    }
    decline() {
        this.isDeclined = true;
    }
    accept(_deps, callback = true) {
        if (this.isLocked) {
            return;
        }
        if (!this.isAccepted) {
            sendSocketMessage({ id: this.id, type: "hotAccept" });
            this.isAccepted = true;
        }
        if (!Array.isArray(_deps)) {
            callback = _deps || callback;
            _deps = [];
        }
        if (callback === true) {
            callback = () => { };
        }
        const deps = _deps.map((dep) => {
            const ext = dep.split(".").pop();
            if (!ext) {
                dep += ".js";
            }
            else if (ext !== "js") {
                dep += ".proxy.js";
            }
            return new URL(dep, `${window.location.origin}${this.id}`).pathname;
        });
        this.acceptCallbacks.push({
            deps,
            callback,
        });
    }
}
function createHotContext(fullUrl) {
    const id = new URL(fullUrl).pathname;
    const existing = REGISTERED_MODULES[id];
    if (existing) {
        existing.lock();
        return existing;
    }
    const state = new HotModuleState(id);
    REGISTERED_MODULES[id] = state;
    return state;
}
exports.createHotContext = createHotContext;
async function applyUpdate(id) {
    const state = REGISTERED_MODULES[id];
    if (!state) {
        return false;
    }
    if (state.isDeclined) {
        return false;
    }
    const acceptCallbacks = state.acceptCallbacks;
    const disposeCallbacks = state.disposeCallbacks;
    state.disposeCallbacks = [];
    state.data = {};
    disposeCallbacks.map((callback) => callback());
    const updateID = Date.now();
    for (const { deps, callback: acceptCallback } of acceptCallbacks) {
        const [module, ...depModules] = await Promise.all([
            Promise.resolve().then(() => __importStar(require(id + `?mtime=${updateID}`))),
            ...deps.map((d) => Promise.resolve().then(() => __importStar(require(d + `?mtime=${updateID}`)))),
        ]);
        acceptCallback({ module, deps: depModules });
    }
    return true;
}
socket.addEventListener("message", ({ data: _data }) => {
    if (!_data) {
        return;
    }
    const data = JSON.parse(_data);
    debug("message", data);
    if (data.type === "reload") {
        debug("message: reload");
        reload();
        return;
    }
    if (data.type !== "update") {
        debug("message: unknown", data);
        return;
    }
    debug("message: update", data);
    debug(data.url, Object.keys(REGISTERED_MODULES));
    applyUpdate(data.url)
        .then((ok) => {
        if (!ok) {
            reload();
        }
    })
        .catch((err) => {
        console.error(err);
        reload();
    });
});
//# sourceMappingURL=hmr-client.js.map