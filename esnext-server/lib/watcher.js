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
    tiny_node_logger_1.default.debug("created chokidar watcher for:", watcher.options.cwd);
    watcher.on("all", (event, file) => tiny_node_logger_1.default.debug("watcher", event, file));
    watcher.on("ready", () => tiny_node_logger_1.default.info("workspace watcher is", chalk_1.default.bold("ready")));
    return watcher;
}
exports.createWatcher = createWatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBMkQ7QUFDM0Qsd0VBQW1DO0FBRW5DLFNBQWdCLGFBQWEsQ0FBQyxPQUFvRDtJQUU5RSxJQUFJLEVBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE9BQU8sQ0FBQSxFQUFFO1FBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztLQUM1QztJQUVELE1BQU0sT0FBTyxHQUFHLGtCQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRTtRQUMvQixHQUFHLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDcEIsTUFBTSxFQUFFLEtBQUs7UUFDYixPQUFPLEVBQUU7WUFDTCxnQkFBZ0I7WUFDaEIsbUJBQW1CO1lBQ25CLGlCQUFpQjtZQUNqQixvQkFBb0I7WUFDcEIsSUFBSTtZQUNKLE9BQU87U0FDVjtLQUNKLENBQUMsQ0FBQztJQUVILDBCQUFHLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFaEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQywwQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakYsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQXpCRCxzQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XG5pbXBvcnQgY2hva2lkYXIsIHtGU1dhdGNoZXIsIFdhdGNoT3B0aW9uc30gZnJvbSBcImNob2tpZGFyXCI7XG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXYXRjaGVyKG9wdGlvbnM6IHsgcm9vdERpcjogc3RyaW5nLCB3YXRjaGVyPzogV2F0Y2hPcHRpb25zIH0pOiBGU1dhdGNoZXIge1xuXG4gICAgaWYgKCFvcHRpb25zPy5yb290RGlyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInJvb3REaXIgbm90IHNwZWNpZmllZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goW10sIHtcbiAgICAgICAgY3dkOiBvcHRpb25zLnJvb3REaXIsXG4gICAgICAgIGF0b21pYzogZmFsc2UsXG4gICAgICAgIGlnbm9yZWQ6IFtcbiAgICAgICAgICAgIFwid2ViX21vZHVsZXMvKipcIixcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcbiAgICAgICAgICAgIFwibm9kZV9tb2R1bGVzLyoqXCIsXG4gICAgICAgICAgICBcIioqL25vZGVfbW9kdWxlcy8qKlwiLFxuICAgICAgICAgICAgXCIuKlwiLFxuICAgICAgICAgICAgXCIqKi8uKlwiXG4gICAgICAgIF1cbiAgICB9KTtcblxuICAgIGxvZy5kZWJ1ZyhcImNyZWF0ZWQgY2hva2lkYXIgd2F0Y2hlciBmb3I6XCIsIHdhdGNoZXIub3B0aW9ucy5jd2QpO1xuXG4gICAgd2F0Y2hlci5vbihcImFsbFwiLCAoZXZlbnQsIGZpbGUpID0+IGxvZy5kZWJ1ZyhcIndhdGNoZXJcIiwgZXZlbnQsIGZpbGUpKTtcbiAgICB3YXRjaGVyLm9uKFwicmVhZHlcIiwgKCkgPT4gbG9nLmluZm8oXCJ3b3Jrc3BhY2Ugd2F0Y2hlciBpc1wiLCBjaGFsay5ib2xkKFwicmVhZHlcIikpKTtcblxuICAgIHJldHVybiB3YXRjaGVyO1xufSJdfQ==