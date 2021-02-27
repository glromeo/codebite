import { FSWatcher, WatchOptions } from "chokidar";
export declare const useWatcher: (options: {
    rootDir: string;
    watcher?: WatchOptions;
}) => FSWatcher;
