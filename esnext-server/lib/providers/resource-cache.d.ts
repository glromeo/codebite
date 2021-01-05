export class ResourceCache extends Map<any, any> {
    constructor(config: {} | undefined, watcher: any);
    rootDir: any;
    watched: Map<any, any>;
    watcher: any;
    deflate: boolean;
    invalidate(path: any): void;
    unwatch(path: any): void;
    watch(filename: any, url: any): void;
    storeSourceMap(url: any, map: any): void;
}
