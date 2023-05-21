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
exports.useWatcher = (0, nano_memoize_1.default)(({ rootDir, watcher: options }) => {
    var _a;
    let ignored = (_a = options === null || options === void 0 ? void 0 : options.ignored) !== null && _a !== void 0 ? _a : [];
    if (!Array.isArray(ignored)) {
        ignored = [ignored];
    }
    const watcher = chokidar_1.default.watch([], {
        ...options,
        cwd: rootDir,
        atomic: false,
        ignored: [
            ...ignored,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBNkM7QUFDN0MsZ0VBQW9DO0FBQ3BDLHdFQUFtQztBQUd0QixRQUFBLFVBQVUsR0FBRyxJQUFBLHNCQUFRLEVBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFnQixFQUFhLEVBQUU7O0lBRXpGLElBQUksT0FBTyxHQUFHLE1BQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE9BQU8sbUNBQUksRUFBRSxDQUFDO0lBQ3JDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3pCLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZCO0lBRUQsTUFBTSxPQUFPLEdBQUcsa0JBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFO1FBQy9CLEdBQUcsT0FBTztRQUNWLEdBQUcsRUFBRSxPQUFPO1FBQ1osTUFBTSxFQUFFLEtBQUs7UUFDYixPQUFPLEVBQUU7WUFDTCxHQUFHLE9BQU87WUFDVixtQkFBbUI7WUFDbkIsb0JBQW9CO1NBQ3ZCO0tBQ0osQ0FBQyxDQUFDO0lBRUgsMEJBQUcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUV0QyxJQUFJLDBCQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsMEJBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3pFO0lBQ0QsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakYsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCBjaG9raWRhciwge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VXYXRjaGVyID0gbWVtb2l6ZWQoKHtyb290RGlyLCB3YXRjaGVyOiBvcHRpb25zfTogRVNOZXh0T3B0aW9ucyk6IEZTV2F0Y2hlciA9PiB7XHJcblxyXG4gICAgbGV0IGlnbm9yZWQgPSBvcHRpb25zPy5pZ25vcmVkID8/IFtdO1xyXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGlnbm9yZWQpKSB7XHJcbiAgICAgICAgaWdub3JlZCA9IFtpZ25vcmVkXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goW10sIHtcclxuICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgIGN3ZDogcm9vdERpcixcclxuICAgICAgICBhdG9taWM6IGZhbHNlLFxyXG4gICAgICAgIGlnbm9yZWQ6IFtcclxuICAgICAgICAgICAgLi4uaWdub3JlZCxcclxuICAgICAgICAgICAgXCIqKi93ZWJfbW9kdWxlcy8qKlwiLFxyXG4gICAgICAgICAgICBcIioqL25vZGVfbW9kdWxlcy8qKlwiXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgbG9nLmRlYnVnKFwiY3JlYXRlZCBjaG9raWRhciB3YXRjaGVyXCIpO1xyXG5cclxuICAgIGlmIChsb2cuaW5jbHVkZXMoXCJkZWJ1Z1wiKSkge1xyXG4gICAgICAgIHdhdGNoZXIub24oXCJhbGxcIiwgKGV2ZW50LCBmaWxlKSA9PiBsb2cuZGVidWcoXCJ3YXRjaGVyXCIsIGV2ZW50LCBmaWxlKSk7XHJcbiAgICB9XHJcbiAgICB3YXRjaGVyLm9uKFwicmVhZHlcIiwgKCkgPT4gbG9nLmluZm8oXCJ3b3Jrc3BhY2Ugd2F0Y2hlciBpc1wiLCBjaGFsay5ib2xkKFwicmVhZHlcIikpKTtcclxuXHJcbiAgICByZXR1cm4gd2F0Y2hlcjtcclxufSk7XHJcbiJdfQ==