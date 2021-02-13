import {FSWatcher} from "chokidar";
import {OutgoingHttpHeaders} from "http";
import {JSON_CONTENT_TYPE} from "./mime-types";
import path from "path";
import log from "tiny-node-logger";
import {parse as parseURL} from "fast-url-parser";

export type Resource = {
    pathname: string
    query: string
    filename: string
    content: string | Buffer
    headers: OutgoingHttpHeaders
    links?: Iterable<string>
    watch?: Iterable<string>
}

/**
 * This Map is used to find out which urls needs to be invalidated in the cache when a file changes in the FS
 *
 * @type {Map<string, string[]|string>}
 * */
export class ResourceCache extends Map<string, Resource> {

    private rootDir: string;
    private watched: Map<string, string | string[]>;
    private watcher: FSWatcher;

    constructor(config: { rootDir?: string, deflate?: boolean }, watcher) {

        super();

        this.rootDir = config.rootDir || process.cwd();
        this.watched = new Map();
        this.watcher = watcher;

        watcher.on("change", (path) => {
            this.invalidate(path);
        });

        watcher.on("unlink", (path) => {
            this.invalidate(path);
            this.unwatch(path);
        });
    }

    invalidate(path) {
        const urls = this.watched.get(path);
        if (urls) {
            if (typeof urls === "string") {
                this.delete(urls);
                log.debug("invalidate", path, "flush", urls);
            } else for (const url of urls) {
                this.delete(url);
                log.debug("invalidate", path, "flush", url);
            }
        } else {
            log.info("invalidate", path, "had no side effects");
        }
    }

    unwatch(path) {
        this.watched.delete(path);
        this.watcher.unwatch(path);
    }

    watch(filename, url) {
        const urls = this.watched.get(filename);
        if (urls) {
            if (typeof urls === "string") {
                if (urls === url) return;
                else this.watched.set(filename, [urls, url]);
            } else {
                if (urls.includes(url)) return;
                else urls.push(url);
            }
        } else {
            this.watched.set(filename, url);
            this.watcher.add(filename);
        }
    }

    set(url: string, resource: Resource): this {

        const filename = path.relative(this.rootDir, resource.filename);

        this.watch(filename, url);

        if (resource.watch) for (const watched of resource.watch) {
            const filename = path.relative(this.rootDir, watched);
            this.watch(filename, url);
        }

        return super.set(url, resource);
    }

    storeSourceMap(url, map: any) {
        const content = JSON.stringify(map);
        const {
            pathname,
            query
        } = parseURL(url, true);
        const filename = pathname + ".map";
        return super.set(filename, {
            filename,
            pathname,
            query,
            content: content,
            headers: {
                "content-type": JSON_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            }
        });
    }

}
