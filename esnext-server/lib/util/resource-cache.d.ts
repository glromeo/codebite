/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
export declare type Resource = {
    pathname: string;
    query: string;
    filename: string;
    content: string | Buffer;
    headers: OutgoingHttpHeaders;
    links: Set<string>;
    watch: string[];
};
/**
 * This Map is used to find out which urls needs to be invalidated in the cache when a file changes in the FS
 *
 * @type {Map<string, string[]|string>}
 * */
export declare class ResourceCache extends Map<string, Promise<Resource>> {
    private rootDir;
    private watched;
    private watcher;
    private deflate;
    constructor(config: {
        rootDir?: string;
        deflate?: boolean;
    }, watcher: any);
    invalidate(path: any): void;
    unwatch(path: any): void;
    watch(filename: any, url: any): void;
    set(url: string, pending: Promise<Resource>): this;
    storeSourceMap(url: any, map: any): void;
}
