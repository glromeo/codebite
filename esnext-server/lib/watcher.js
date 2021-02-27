"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWatcher = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const pico_memoize_1 = __importDefault(require("pico-memoize"));
exports.useWatcher = pico_memoize_1.default((options) => {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBMkQ7QUFDM0Qsd0VBQW1DO0FBQ25DLGdFQUFtQztBQUV0QixRQUFBLFVBQVUsR0FBRyxzQkFBTyxDQUFDLENBQUMsT0FBb0QsRUFBYyxFQUFFO0lBRW5HLElBQUksRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxDQUFBLEVBQUU7UUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0tBQzVDO0lBRUQsTUFBTSxPQUFPLEdBQUcsa0JBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFO1FBQy9CLE1BQU0sRUFBRSxLQUFLO1FBQ2IsT0FBTyxFQUFFO1lBQ0wsbUJBQW1CO1lBQ25CLG9CQUFvQjtZQUNwQixPQUFPO1NBQ1Y7S0FDSixDQUFDLENBQUM7SUFFSCwwQkFBRyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXRDLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsMEJBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLDBCQUFHLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLGVBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWpGLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xuaW1wb3J0IGNob2tpZGFyLCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuXG5leHBvcnQgY29uc3QgdXNlV2F0Y2hlciA9IG1lbW9pemUoKG9wdGlvbnM6IHsgcm9vdERpcjogc3RyaW5nLCB3YXRjaGVyPzogV2F0Y2hPcHRpb25zIH0pOiBGU1dhdGNoZXIgID0+IHtcblxuICAgIGlmICghb3B0aW9ucz8ucm9vdERpcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJyb290RGlyIG5vdCBzcGVjaWZpZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgd2F0Y2hlciA9IGNob2tpZGFyLndhdGNoKFtdLCB7XG4gICAgICAgIGF0b21pYzogZmFsc2UsXG4gICAgICAgIGlnbm9yZWQ6IFtcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcbiAgICAgICAgICAgIFwiKiovbm9kZV9tb2R1bGVzLyoqXCIsXG4gICAgICAgICAgICBcIioqLy4qXCJcbiAgICAgICAgXVxuICAgIH0pO1xuXG4gICAgbG9nLmRlYnVnKFwiY3JlYXRlZCBjaG9raWRhciB3YXRjaGVyXCIpO1xuXG4gICAgd2F0Y2hlci5vbihcImFsbFwiLCAoZXZlbnQsIGZpbGUpID0+IGxvZy5kZWJ1ZyhcIndhdGNoZXJcIiwgZXZlbnQsIGZpbGUpKTtcbiAgICB3YXRjaGVyLm9uKFwicmVhZHlcIiwgKCkgPT4gbG9nLmluZm8oXCJ3b3Jrc3BhY2Ugd2F0Y2hlciBpc1wiLCBjaGFsay5ib2xkKFwicmVhZHlcIikpKTtcblxuICAgIHJldHVybiB3YXRjaGVyO1xufSk7XG4iXX0=