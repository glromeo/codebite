import chalk from "chalk";
import chokidar, {FSWatcher, WatchOptions} from "chokidar";
import log from "tiny-node-logger";
import memoize from "pico-memoize";

export const useWatcher = memoize((options: { rootDir: string, watcher?: WatchOptions }): FSWatcher  => {

    if (!options?.rootDir) {
        throw new Error("rootDir not specified");
    }

    const watcher = chokidar.watch([], {
        atomic: false,
        ignored: [
            "**/web_modules/**",
            "**/node_modules/**",
            "**/.*"
        ]
    });

    log.debug("created chokidar watcher");

    watcher.on("all", (event, file) => log.debug("watcher", event, file));
    watcher.on("ready", () => log.info("workspace watcher is", chalk.bold("ready")));

    return watcher;
});
