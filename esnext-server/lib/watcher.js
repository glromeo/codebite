"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatcher = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
exports.useWatcher = nano_memoize_1.default(({ rootDir, watcher: options }) => {
    var _a;
    const watcher = chokidar_1.default.watch([], {
        ...options,
        cwd: rootDir,
        atomic: false,
        ignored: [
            ...(_a = options === null || options === void 0 ? void 0 : options.ignored) !== null && _a !== void 0 ? _a : [],
            "**/web_modules/**",
            "**/node_modules/**"
        ]
    });
    tiny_node_logger_1.default.debug("created chokidar watcher");
    if (tiny_node_logger_1.default.includes("debug")) {
        watcher.on("all", (event, file) => tiny_node_logger_1.default.debug("watcher", event, file));
    }
    watcher.on("ready", () => tiny_node_logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    return watcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBNkM7QUFDN0MsZ0VBQW9DO0FBQ3BDLHdFQUFtQztBQUd0QixRQUFBLFVBQVUsR0FBRyxzQkFBUSxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBZ0IsRUFBYSxFQUFFOztJQUV6RixNQUFNLE9BQU8sR0FBRyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDL0IsR0FBRyxPQUFPO1FBQ1YsR0FBRyxFQUFFLE9BQU87UUFDWixNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRTtZQUNMLEdBQUcsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxtQ0FBSSxFQUFFO1lBQ3pCLG1CQUFtQjtZQUNuQixvQkFBb0I7U0FDdkI7S0FDSixDQUFDLENBQUM7SUFFSCwwQkFBRyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXRDLElBQUksMEJBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQywwQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQywwQkFBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGNob2tpZGFyLCB7RlNXYXRjaGVyfSBmcm9tIFwiY2hva2lkYXJcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVdhdGNoZXIgPSBtZW1vaXplZCgoe3Jvb3REaXIsIHdhdGNoZXI6IG9wdGlvbnN9OiBFU05leHRPcHRpb25zKTogRlNXYXRjaGVyID0+IHtcclxuXHJcbiAgICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goW10sIHtcclxuICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgIGN3ZDogcm9vdERpcixcclxuICAgICAgICBhdG9taWM6IGZhbHNlLFxyXG4gICAgICAgIGlnbm9yZWQ6IFtcclxuICAgICAgICAgICAgLi4ub3B0aW9ucz8uaWdub3JlZCA/PyBbXSxcclxuICAgICAgICAgICAgXCIqKi93ZWJfbW9kdWxlcy8qKlwiLFxyXG4gICAgICAgICAgICBcIioqL25vZGVfbW9kdWxlcy8qKlwiXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgbG9nLmRlYnVnKFwiY3JlYXRlZCBjaG9raWRhciB3YXRjaGVyXCIpO1xyXG5cclxuICAgIGlmIChsb2cuaW5jbHVkZXMoXCJkZWJ1Z1wiKSkge1xyXG4gICAgICAgIHdhdGNoZXIub24oXCJhbGxcIiwgKGV2ZW50LCBmaWxlKSA9PiBsb2cuZGVidWcoXCJ3YXRjaGVyXCIsIGV2ZW50LCBmaWxlKSk7XHJcbiAgICB9XHJcbiAgICB3YXRjaGVyLm9uKFwicmVhZHlcIiwgKCkgPT4gbG9nLmluZm8oXCJ3b3Jrc3BhY2Ugd2F0Y2hlciBpc1wiLCBjaGFsay5ib2xkKFwicmVhZHlcIikpKTtcclxuXHJcbiAgICByZXR1cm4gd2F0Y2hlcjtcclxufSk7XHJcbiJdfQ==