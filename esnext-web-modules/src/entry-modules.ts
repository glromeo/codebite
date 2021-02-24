import resolve from "resolve";
import {PackageMeta, readJson} from "./utility";
import log from "tiny-node-logger";

export function collectEntryModules(resolveOptions: resolve.SyncOpts, squash: Set<string>) {

    const readManifest = (module: string, ignoreErrors: boolean = false): PackageMeta | null => {
        try {
            return readJson(resolve.sync(`${module}/package.json`, resolveOptions));
        } catch (ignored) {
            log.debug`unable to read package.json for: ${module}`;
            return null;
        }
    };

    const appPkg = readManifest(".")!;

    let debugDeps = "#dependencies\r\n", indent = "##";

    let modules = collectEntryModules(appPkg);

    console.log(require('ascii-tree').generate(debugDeps));

    return modules;

    function collectDependencies(entryModule: PackageMeta) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }

    function collectEntryModules(entryModule: PackageMeta, entryModules = new Set<string>(), visited = new Map<string, string>(), ancestor?: string) {
        for (const dependency of collectDependencies(entryModule)) if (!squash.has(dependency)) {
            debugDeps += `${indent}${dependency}\r\n`;
            if (visited.has(dependency)) {
                if (visited.get(dependency) !== ancestor) {
                    entryModules.add(dependency);
                }
            } else {
                visited.set(dependency, ancestor!);
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
