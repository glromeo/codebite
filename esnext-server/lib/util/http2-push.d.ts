import { FSWatcher } from "chokidar";
import { ServerHttp2Stream } from "http2";
import { ESNextOptions } from "../configure";
export declare const useHttp2Push: (options: ESNextOptions, watcher: FSWatcher) => {
    http2Push: (stream: ServerHttp2Stream, pathname: any, urls: readonly string[]) => void;
};
