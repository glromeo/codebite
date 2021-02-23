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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix3REFBMkQ7QUFDM0Qsd0VBQW1DO0FBRW5DLFNBQWdCLGFBQWEsQ0FBQyxPQUFvRDtJQUU5RSxJQUFJLEVBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE9BQU8sQ0FBQSxFQUFFO1FBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztLQUM1QztJQUVELE1BQU0sT0FBTyxHQUFHLGtCQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRTtRQUMvQixHQUFHLEVBQUUsT0FBTyxDQUFDLE9BQU87UUFDcEIsTUFBTSxFQUFFLEtBQUs7UUFDYixPQUFPLEVBQUU7WUFDTCxnQkFBZ0I7WUFDaEIsbUJBQW1CO1lBQ25CLGlCQUFpQjtZQUNqQixvQkFBb0I7WUFDcEIsSUFBSTtZQUNKLE9BQU87U0FDVjtLQUNKLENBQUMsQ0FBQztJQUVILDBCQUFHLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFaEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQywwQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFakYsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQztBQXpCRCxzQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCBjaG9raWRhciwge0ZTV2F0Y2hlciwgV2F0Y2hPcHRpb25zfSBmcm9tIFwiY2hva2lkYXJcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdhdGNoZXIob3B0aW9uczogeyByb290RGlyOiBzdHJpbmcsIHdhdGNoZXI/OiBXYXRjaE9wdGlvbnMgfSk6IEZTV2F0Y2hlciB7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zPy5yb290RGlyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicm9vdERpciBub3Qgc3BlY2lmaWVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHdhdGNoZXIgPSBjaG9raWRhci53YXRjaChbXSwge1xyXG4gICAgICAgIGN3ZDogb3B0aW9ucy5yb290RGlyLFxyXG4gICAgICAgIGF0b21pYzogZmFsc2UsXHJcbiAgICAgICAgaWdub3JlZDogW1xyXG4gICAgICAgICAgICBcIndlYl9tb2R1bGVzLyoqXCIsXHJcbiAgICAgICAgICAgIFwiKiovd2ViX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgXCIuKlwiLFxyXG4gICAgICAgICAgICBcIioqLy4qXCJcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICBsb2cuZGVidWcoXCJjcmVhdGVkIGNob2tpZGFyIHdhdGNoZXIgZm9yOlwiLCB3YXRjaGVyLm9wdGlvbnMuY3dkKTtcclxuXHJcbiAgICB3YXRjaGVyLm9uKFwiYWxsXCIsIChldmVudCwgZmlsZSkgPT4gbG9nLmRlYnVnKFwid2F0Y2hlclwiLCBldmVudCwgZmlsZSkpO1xyXG4gICAgd2F0Y2hlci5vbihcInJlYWR5XCIsICgpID0+IGxvZy5pbmZvKFwid29ya3NwYWNlIHdhdGNoZXIgaXNcIiwgY2hhbGsuYm9sZChcInJlYWR5XCIpKSk7XHJcblxyXG4gICAgcmV0dXJuIHdhdGNoZXI7XHJcbn0iXX0=