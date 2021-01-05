import { FSWatcher } from "chokidar";
import { IncomingHttpHeaders } from "http";
import { ESNextOptions } from "../configure";
export declare const useResourceProvider: (options: ESNextOptions, watcher: FSWatcher) => {
    provideResource: (url: any, { "accept": accept, "user-agent": userAgent }: IncomingHttpHeaders) => Promise<import("../util/resource-cache").Resource | {
        pathname: any;
        query: any;
        filename: string;
        content: string;
        headers: {
            "content-type": any;
            "content-length": number;
            "last-modified": string;
            "cache-control": string;
        };
        links: any;
        watch: any;
    }>;
};
