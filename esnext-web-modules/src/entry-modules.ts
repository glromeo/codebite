import resolve from "resolve";
import {PackageMeta, readJson} from "./utility";

export function collectEntryModules(resolveOptions: resolve.SyncOpts, squash: Set<string>) {

    const readManifest = (module: string) => readJson(resolve.sync(`${module}/package.json`, resolveOptions));

    const appPkg: PackageMeta = readManifest(".");

    // let debugDeps = "#dependencies\r\n", indent = "##";

    return collectEntryModules(appPkg);

    // console.log(require('ascii-tree').generate(debugDeps));

    function collectDependencies(entryModule: PackageMeta) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }

    function collectEntryModules(entryModule: PackageMeta, entryModules = new Set<string>(), visited = new Map<string, string>(), ancestor?: string) {
        for (const dependency of collectDependencies(entryModule)) if (!squash.has(dependency)) {
            // debugDeps += `${indent}${dependency}\r\n`;
            if (visited.has(dependency) && visited.get(dependency) !== ancestor) {
                entryModules.add(dependency);
            } else try {
                visited.set(dependency, ancestor!);
                // indent += "#";
                collectEntryModules(readManifest(dependency), entryModules, visited, ancestor || dependency);
                // indent = indent.slice(0, -1);
            } catch (ignored) {
                visited.delete(dependency);
            }
        }
        return entryModules;
    }

}