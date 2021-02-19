/// <reference types="node" />
import { FSWatcher } from "chokidar";
import { OutgoingHttpHeaders } from "http";
import { ESNextOptions } from "../configure";
export declare type Query = {
    [name: string]: string;
};
export declare type Resource = {
    pathname: string;
    query: Query;
    filename: string;
    content: string | Buffer;
    headers: OutgoingHttpHeaders;
    links: readonly string[];
    watch?: Iterable<string>;
    onchange?: () => void;
};
export declare const NO_LINKS: readonly never[];
export declare const NO_QUERY: Readonly<{}>;
export declare const useResourceProvider: (options: ESNextOptions, watcher: FSWatcher) => {
    provideResource(url: string): Promise<Resource>;
};
