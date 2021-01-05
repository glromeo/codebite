import chalk from "chalk";
import chokidar, {FSWatcher, WatchOptions} from "chokidar";
import log from "tiny-node-logger";

export function createWatcher(options: { rootDir: string, watcher?: WatchOptions }): FSWatcher {

    if (!options?.rootDir) {
        throw new Error("rootDir not specified");
    }

    const watcher = chokidar.watch([], {
        cwd: options.rootDir,
        atomic: false
    });

    log.debug("created chokidar watcher for cwd:", watcher.options.cwd);

    watcher.on("all", (event, file) => log.debug("watcher", event, file));
    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    return watcher;
}