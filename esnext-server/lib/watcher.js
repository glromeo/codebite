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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBNkM7QUFDN0MsZ0VBQW9DO0FBQ3BDLHdFQUFtQztBQUd0QixRQUFBLFVBQVUsR0FBRyxzQkFBUSxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBZ0IsRUFBYSxFQUFFOztJQUV6RixNQUFNLE9BQU8sR0FBRyxrQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDL0IsR0FBRyxPQUFPO1FBQ1YsR0FBRyxFQUFFLE9BQU87UUFDWixNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRTtZQUNMLFNBQUcsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE9BQU8sbUNBQUksRUFBRTtZQUN6QixtQkFBbUI7WUFDbkIsb0JBQW9CO1NBQ3ZCO0tBQ0osQ0FBQyxDQUFDO0lBRUgsMEJBQUcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUV0QyxJQUFJLDBCQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsMEJBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3pFO0lBQ0QsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakYsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCBjaG9raWRhciwge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi9jb25maWd1cmVcIjtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VXYXRjaGVyID0gbWVtb2l6ZWQoKHtyb290RGlyLCB3YXRjaGVyOiBvcHRpb25zfTogRVNOZXh0T3B0aW9ucyk6IEZTV2F0Y2hlciA9PiB7XHJcblxyXG4gICAgY29uc3Qgd2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKFtdLCB7XHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICBjd2Q6IHJvb3REaXIsXHJcbiAgICAgICAgYXRvbWljOiBmYWxzZSxcclxuICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgIC4uLm9wdGlvbnM/Lmlnbm9yZWQgPz8gW10sXHJcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIlxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIGxvZy5kZWJ1ZyhcImNyZWF0ZWQgY2hva2lkYXIgd2F0Y2hlclwiKTtcclxuXHJcbiAgICBpZiAobG9nLmluY2x1ZGVzKFwiZGVidWdcIikpIHtcclxuICAgICAgICB3YXRjaGVyLm9uKFwiYWxsXCIsIChldmVudCwgZmlsZSkgPT4gbG9nLmRlYnVnKFwid2F0Y2hlclwiLCBldmVudCwgZmlsZSkpO1xyXG4gICAgfVxyXG4gICAgd2F0Y2hlci5vbihcInJlYWR5XCIsICgpID0+IGxvZy5pbmZvKFwid29ya3NwYWNlIHdhdGNoZXIgaXNcIiwgY2hhbGsuYm9sZChcInJlYWR5XCIpKSk7XHJcblxyXG4gICAgcmV0dXJuIHdhdGNoZXI7XHJcbn0pO1xyXG4iXX0=