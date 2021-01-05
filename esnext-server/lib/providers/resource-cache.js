"use strict";
const log = require("tiny-node-logger");
const path = require("path");
const util = require("util");
const zlib = require("zlib");
const { JSON_CONTENT_TYPE } = require("esnext-server-extras");
/**
 * This Map is used to find out which urls needs to be invalidated in the cache when a file changes in the FS
 *
 * @type {Map<string, string[]|string>}
 * */
module.exports.ResourceCache = class extends Map {
    constructor(config = {}, watcher) {
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
            this.deflate = util.promisify(zlib.deflate);
        }
        this.deflate = false; // TODO: fix me!
    }
    invalidate(path) {
        const urls = this.watched.get(path);
        if (urls) {
            if (typeof urls === "string") {
                this.delete(urls);
                log.debug("invalidate", path, "flush", urls);
            }
            else
                for (const url of urls) {
                    this.delete(url);
                    log.debug("invalidate", path, "flush", url);
                }
        }
        else {
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
                if (urls === url)
                    return;
                else
                    this.watched.set(filename, [urls, url]);
            }
            else {
                if (urls.includes(url))
                    return;
                else
                    urls.push(url);
            }
        }
        else {
            this.watched.set(filename, url);
            this.watcher.add(filename);
        }
    }
    async set(url, resource) {
        if (this.deflate) {
            const deflated = await this.deflate(resource.content);
            super.set(url, {
                ...resource,
                content: deflated,
                headers: {
                    ...resource.headers,
                    "content-length": Buffer.byteLength(deflated),
                    "content-encoding": "deflate"
                }
            });
        }
        else {
            super.set(url, resource);
        }
        const filename = path.relative(this.rootDir, resource.filename);
        this.watch(filename, url);
        if (resource.watch)
            for (const watched of resource.watch) {
                const filename = path.relative(this.rootDir, watched);
                this.watch(filename, url);
            }
    }
    storeSourceMap(url, map) {
        const content = JSON.stringify(map);
        const questionMark = url.indexOf("?");
        if (questionMark > 0) {
            url = url.substring(0, questionMark);
        }
        super.set(url + ".map", {
            content: content,
            headers: {
                "content-type": JSON_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            }
        });
    }
};
//# sourceMappingURL=resource-cache.ts.map