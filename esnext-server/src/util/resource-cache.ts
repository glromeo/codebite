import {FSWatcher} from "chokidar";
import {OutgoingHttpHeaders} from "http";
import {JSON_CONTENT_TYPE} from "./mime-types";
import path from "path";
import log from "tiny-node-logger";
import {promisify} from "util";
import zlib from "zlib";

export type Resource = {
    pathname: string
    query: string
    filename: string
    content: string | Buffer
    headers: OutgoingHttpHeaders
    links: Set<string>
    watch: string[]
}

type Deflate = (content: (string | Buffer)) => Promise<Buffer>;

/**
 * This Map is used to find out which urls needs to be invalidated in the cache when a file changes in the FS
 *
 * @type {Map<string, string[]|string>}
 * */
export class ResourceCache extends Map<string, Promise<Resource>> {

    private rootDir: string;
    private watched: Map<string, string | string[]>;
    private watcher: FSWatcher;
    private deflate: Deflate | null;

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

        if (config.deflate) {
            this.deflate = promisify(zlib.deflate);
        }

        this.deflate = null; // TODO: fix me!
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

    set(url: string, pending: Promise<Resource>): this {

        super.set(url, pending.then(async resource => {

            const filename = path.relative(this.rootDir, resource.filename);

            if (this.deflate) try {
                let deflated = await this.deflate(resource.content);
                resource.content = deflated;
                resource.headers = {
                    ...resource.headers,
                    "content-length": Buffer.byteLength(deflated),
                    "content-encoding": "deflate"
                }
            } catch(err) {
                log.error(`failed to deflate resource: ${filename}`, err);
            }

            this.watch(filename, url);

            if (resource.watch) for (const watched of resource.watch) {
                const filename = path.relative(this.rootDir, watched);
                this.watch(filename, url);
            }

            return resource;
        }));
        return this;
    }

    storeSourceMap(url, map:any) {
        const content = JSON.stringify(map);
        const questionMark = url.indexOf("?");
        if (questionMark > 0) {
            url = url.substring(0, questionMark);
        }
        // @ts-ignore
        super.set(url + ".map", Promise.resolve({
            content: content,
            headers: {
                "content-type": JSON_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            }
        }));
    }

}
