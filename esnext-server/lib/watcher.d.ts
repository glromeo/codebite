import { FSWatcher, WatchOptions } from "chokidar";
export declare function createWatcher(options: {
    rootDir: string;
    watcher?: WatchOptions;
}): FSWatcher;
