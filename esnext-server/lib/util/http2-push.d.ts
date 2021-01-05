import { FSWatcher } from "chokidar";
import { ESNextOptions } from "../configure";
export declare const useHttp2Push: (options: ESNextOptions, watcher: FSWatcher) => {
    http2Push: (stream: any, pathname: any, links: any, clientHeaders: any) => Promise<void>;
};
