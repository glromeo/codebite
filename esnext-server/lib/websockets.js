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
    const wss = new ws_1.default.Server({ noServer: true });
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
            tiny_node_logger_1.default.info("websockets:", chalk_1.default.underline(module));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93ZWJzb2NrZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQiwyQkFBOEI7QUFDOUIsK0JBQXNDO0FBQ3RDLHdFQUFtQztBQUNuQyw0Q0FBMkI7QUFFM0IsTUFBTSxjQUFjLEdBQUcsc0JBQXNCLENBQUM7QUFDOUMsU0FBZ0IsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO0lBRXBELE1BQU0sR0FBRyxHQUFHLElBQUksWUFBUyxDQUFDLE1BQU0sQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBRW5ELE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN2QyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDckQsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7U0FDTjtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUU1QixTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUTtRQUN0QixTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5QiwwQkFBRyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxlQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELE9BQU8sQ0FBQyxFQUFFLENB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Q0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlFLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXZFRCw0Q0F1RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCB7ZXhpc3RzU3luY30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7ZGlybmFtZSwgcmVzb2x2ZX0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gXCJ3c1wiO1xyXG5cclxuY29uc3QgV1NfQ09ORklHX0ZJTEUgPSBcIndlYnNvY2tldHMuY29uZmlnLmpzXCI7XHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXZWJTb2NrZXRzKGNvbmZpZywgc2VydmVyLCB3YXRjaGVyKSB7XHJcblxyXG4gICAgY29uc3Qgd3NzID0gbmV3IFdlYlNvY2tldC5TZXJ2ZXIoe25vU2VydmVyOiB0cnVlfSk7XHJcblxyXG4gICAgc2VydmVyLm9uKFwidXBncmFkZVwiLCAocmVxLCBzb2NrZXQsIGhlYWQpID0+IHtcclxuICAgICAgICBpZiAocmVxLmhlYWRlcnNbXCJzZWMtd2Vic29ja2V0LXByb3RvY29sXCJdICE9PSBcImVzbS1obXJcIikge1xyXG4gICAgICAgICAgICB3c3MuaGFuZGxlVXBncmFkZShyZXEsIHNvY2tldCwgaGVhZCwgKGNsaWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgd3NzLmVtaXQoXCJjb25uZWN0aW9uXCIsIGNsaWVudCwgcmVxKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgbGlzdGVuZXJzID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIG9uKG5hbWUsIGxpc3RlbmVyKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzLnNldChuYW1lLCBsaXN0ZW5lcik7XHJcbiAgICAgICAgbG9nLmRlYnVnKFwiYWRkZWQgbWVzc2FnZSBsaXN0ZW5lcjpcIiwgY2hhbGsubWFnZW50YShuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgd2F0Y2hlci5vbihcImFsbFwiLCBhc3luYyBmdW5jdGlvbiAoZXZlbnQsIHBhdGgpIHtcclxuXHJcbiAgICAgICAgaWYgKHBhdGguZW5kc1dpdGgoV1NfQ09ORklHX0ZJTEUpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IHJlc29sdmUoY29uZmlnLnJvb3REaXIsIHBhdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xyXG4gICAgICAgICAgICAgICAgZGlybmFtZTogZGlybmFtZShtb2R1bGUpLFxyXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IG1vZHVsZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZGVsZXRlIHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKG1vZHVsZSldO1xyXG5cclxuICAgICAgICAgICAgbG9nLmluZm8oXCJ3ZWJzb2NrZXRzOlwiLCBjaGFsay51bmRlcmxpbmUobW9kdWxlKSk7XHJcbiAgICAgICAgICAgIHJlcXVpcmUobW9kdWxlKS5jYWxsKGNvbnRleHQsIGNvbmZpZywgd2F0Y2hlciwgb24pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZvciAoY29uc3QgYmFzZWRpciBvZiBPYmplY3QudmFsdWVzPHN0cmluZz4oY29uZmlnLm1vdW50KSkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcmVzb2x2ZShjb25maWcucm9vdERpciwgYmFzZWRpciwgV1NfQ09ORklHX0ZJTEUpO1xyXG4gICAgICAgIGlmIChleGlzdHNTeW5jKGZpbGVuYW1lKSkge1xyXG4gICAgICAgICAgICB3YXRjaGVyLmFkZChmaWxlbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1hcnNoYWxsKGhlYWRlciwgcGF5bG9hZCkge1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkID8gYCR7aGVhZGVyfToke0pTT04uc3RyaW5naWZ5KHBheWxvYWQpfWAgOiBoZWFkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW5tYXJzaGFsbChtZXNzYWdlKSB7XHJcbiAgICAgICAgY29uc3Qgc2VwID0gbWVzc2FnZS5pbmRleE9mKFwiOlwiKTtcclxuICAgICAgICBsZXQgaGVhZGVyLCBwYXlsb2FkO1xyXG4gICAgICAgIGlmIChzZXAgIT09IC0xKSB7XHJcbiAgICAgICAgICAgIGhlYWRlciA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIHNlcCk7XHJcbiAgICAgICAgICAgIHBheWxvYWQgPSBKU09OLnBhcnNlKG1lc3NhZ2Uuc3Vic3RyaW5nKHNlcCArIDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWFkZXIgPSBtZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsb2cuZGVidWcoXCJ3czpcIiwgaGVhZGVyLCBtZXNzYWdlLmxlbmd0aCA8IDI1MCA/IHBheWxvYWQgOiBgey4uLn1gKTtcclxuICAgICAgICByZXR1cm4ge2hlYWRlciwgcGF5bG9hZH07XHJcbiAgICB9XHJcblxyXG4gICAgd3NzLm9uKFwiY29ubmVjdGlvblwiLCB3cyA9PiB7XHJcblxyXG4gICAgICAgIHdzLm9uKFwibWVzc2FnZVwiLCBtZXNzYWdlID0+IHtcclxuICAgICAgICAgICAgY29uc3Qge2hlYWRlciwgcGF5bG9hZH0gPSB1bm1hcnNoYWxsKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGxpc3RlbmVycy5nZXQoaGVhZGVyKTtcclxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKGxpc3RlbmVycywgcGF5bG9hZCwgKGhlYWRlciwgcGF5bG9hZCkgPT4gd3Muc2VuZChtYXJzaGFsbChoZWFkZXIsIHBheWxvYWQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgd3Muc2VuZChcImNvbm5lY3RlZDpcIiArIEpTT04uc3RyaW5naWZ5KHtzaW5jZTogbmV3IERhdGUoKS50b1VUQ1N0cmluZygpfSkpO1xyXG4gICAgfSk7XHJcbn1cclxuIl19