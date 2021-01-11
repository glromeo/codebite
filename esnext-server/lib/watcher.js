"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWatcher = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
function createWatcher(options) {
    if (!(options === null || options === void 0 ? void 0 : options.rootDir)) {
        throw new Error("rootDir not specified");
    }
    const watcher = chokidar_1.default.watch([], {
        cwd: options.rootDir,
        atomic: false,
        ignored: [
            "web_modules/**",
            "**/web_modules/**",
            "node_modules/**",
            "**/node_modules/**",
            ".*",
            "**/.*"
        ]
    });
    tiny_node_logger_1.default.debug("created chokidar watcher for cwd:", watcher.options.cwd);
    watcher.on("all", (event, file) => tiny_node_logger_1.default.debug("watcher", event, file));
    watcher.on("ready", () => tiny_node_logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    return watcher;
}
exports.createWatcher = createWatcher;
//# sourceMappingURL=watcher.js.map