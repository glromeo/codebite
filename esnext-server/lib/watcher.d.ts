/// <reference types="nano-memoize" />
import { FSWatcher } from "chokidar";
import { ESNextOptions } from "./configure";
export declare const useWatcher: (({ rootDir, watcher: options }: ESNextOptions) => FSWatcher) & import("nano-memoize").nanomemoize;
