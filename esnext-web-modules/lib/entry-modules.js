"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectEntryModules = void 0;
const resolve_1 = __importDefault(require("resolve"));
const utility_1 = require("./utility");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
function collectEntryModules(resolveOptions, squash) {
    const readManifest = (module, ignoreErrors = false) => {
        try {
            return utility_1.readJson(resolve_1.default.sync(`${module}/package.json`, resolveOptions));
        }
        catch (ignored) {
            tiny_node_logger_1.default.debug `unable to read package.json for: ${module}`;
            return null;
        }
    };
    const appPkg = readManifest(".");
    let debugDeps = "#dependencies\r\n", indent = "##";
    let modules = collectEntryModules(appPkg);
    console.log(require('ascii-tree').generate(debugDeps));
    return modules;
    function collectDependencies(entryModule) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }
    function collectEntryModules(entryModule, entryModules = new Set(), visited = new Map(), ancestor) {
        for (const dependency of collectDependencies(entryModule))
            if (!squash.has(dependency)) {
                debugDeps += `${indent}${dependency}\r\n`;
                if (visited.has(dependency)) {
                    if (visited.get(dependency) !== ancestor) {
                        entryModules.add(dependency);
                    }
                }
                else {
                    visited.set(dependency, ancestor);
                    indent += "#";
                    const dependencyManifest = readManifest(dependency);
                    if (dependencyManifest) {
                        collectEntryModules(dependencyManifest, entryModules, visited, ancestor || dependency);
                    }
                    indent = indent.slice(0, -1);
                }
            }
        return entryModules;
    }
}
exports.collectEntryModules = collectEntryModules;
//# sourceMappingURL=entry-modules.js.map