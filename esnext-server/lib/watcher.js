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
        atomic: false,
        ignored: [
            "**/web_modules/**",
            "**/node_modules/**",
            "**/.*"
        ]
    });
    tiny_node_logger_1.default.debug("created chokidar watcher");
    watcher.on("all", (event, file) => tiny_node_logger_1.default.debug("watcher", event, file));
    watcher.on("ready", () => tiny_node_logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    return watcher;
}
exports.createWatcher = createWatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBMkQ7QUFDM0Qsd0VBQW1DO0FBRW5DLFNBQWdCLGFBQWEsQ0FBQyxPQUFvRDtJQUU5RSxJQUFJLEVBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE9BQU8sQ0FBQSxFQUFFO1FBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztLQUM1QztJQUVELE1BQU0sT0FBTyxHQUFHLGtCQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRTtRQUMvQixNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRTtZQUNMLG1CQUFtQjtZQUNuQixvQkFBb0I7WUFDcEIsT0FBTztTQUNWO0tBQ0osQ0FBQyxDQUFDO0lBRUgsMEJBQUcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUV0QyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLDBCQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQywwQkFBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRixPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBckJELHNDQXFCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGNob2tpZGFyLCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV2F0Y2hlcihvcHRpb25zOiB7IHJvb3REaXI6IHN0cmluZywgd2F0Y2hlcj86IFdhdGNoT3B0aW9ucyB9KTogRlNXYXRjaGVyIHtcclxuXHJcbiAgICBpZiAoIW9wdGlvbnM/LnJvb3REaXIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJyb290RGlyIG5vdCBzcGVjaWZpZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgd2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKFtdLCB7XHJcbiAgICAgICAgYXRvbWljOiBmYWxzZSxcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIqKi8uKlwiXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgbG9nLmRlYnVnKFwiY3JlYXRlZCBjaG9raWRhciB3YXRjaGVyXCIpO1xyXG5cclxuICAgIHdhdGNoZXIub24oXCJhbGxcIiwgKGV2ZW50LCBmaWxlKSA9PiBsb2cuZGVidWcoXCJ3YXRjaGVyXCIsIGV2ZW50LCBmaWxlKSk7XHJcbiAgICB3YXRjaGVyLm9uKFwicmVhZHlcIiwgKCkgPT4gbG9nLmluZm8oXCJ3b3Jrc3BhY2Ugd2F0Y2hlciBpc1wiLCBjaGFsay5ib2xkKFwicmVhZHlcIikpKTtcclxuXHJcbiAgICByZXR1cm4gd2F0Y2hlcjtcclxufSJdfQ==