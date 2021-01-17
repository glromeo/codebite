import { FSWatcher } from "chokidar";
import { IncomingHttpHeaders } from "http";
import { ESNextOptions } from "../configure";
import { Resource } from "../util/resource-cache";
export declare const useResourceProvider: (options: ESNextOptions, watcher: FSWatcher) => {
    provideResource(url: string, headers: IncomingHttpHeaders): Promise<Resource>;
};
