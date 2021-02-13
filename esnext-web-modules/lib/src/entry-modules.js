"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectEntryModules = void 0;
const resolve_1 = __importDefault(require("resolve"));
const utility_1 = require("./utility");
function collectEntryModules(resolveOptions, squash) {
    const readManifest = (module) => utility_1.readJson(resolve_1.default.sync(`${module}/package.json`, resolveOptions));
    const appPkg = readManifest(".");
    return collectEntryModules(appPkg);
    function collectDependencies(entryModule) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }
    function collectEntryModules(entryModule, entryModules = new Set(), visited = new Map(), ancestor) {
        for (const dependency of collectDependencies(entryModule))
            if (!squash.has(dependency)) {
                if (visited.has(dependency) && visited.get(dependency) !== ancestor) {
                    entryModules.add(dependency);
                }
                else
                    try {
                        visited.set(dependency, ancestor);
                        collectEntryModules(readManifest(dependency), entryModules, visited, ancestor || dependency);
                    }
                    catch (ignored) {
                        visited.delete(dependency);
                    }
            }
        return entryModules;
    }
}
exports.collectEntryModules = collectEntryModules;
//# sourceMappingURL=entry-modules.js.map