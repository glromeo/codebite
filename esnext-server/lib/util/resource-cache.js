"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCache = void 0;
const mime_types_1 = require("./mime-types");
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const util_1 = require("util");
const zlib_1 = __importDefault(require("zlib"));
/**
 * This Map is used to find out which urls needs to be invalidated in the cache when a file changes in the FS
 *
 * @type {Map<string, string[]|string>}
 * */
class ResourceCache extends Map {
    constructor(config, watcher) {
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
            this.deflate = util_1.promisify(zlib_1.default.deflate);
        }
        this.deflate = null; // TODO: fix me!
    }
    invalidate(path) {
        const urls = this.watched.get(path);
        if (urls) {
            if (typeof urls === "string") {
                this.delete(urls);
                tiny_node_logger_1.default.debug("invalidate", path, "flush", urls);
            }
            else
                for (const url of urls) {
                    this.delete(url);
                    tiny_node_logger_1.default.debug("invalidate", path, "flush", url);
                }
        }
        else {
            tiny_node_logger_1.default.info("invalidate", path, "had no side effects");
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
    set(url, pending) {
        super.set(url, pending.then(async (resource) => {
            const filename = path_1.default.relative(this.rootDir, resource.filename);
            if (this.deflate)
                try {
                    let deflated = await this.deflate(resource.content);
                    resource.content = deflated;
                    resource.headers = {
                        ...resource.headers,
                        "content-length": Buffer.byteLength(deflated),
                        "content-encoding": "deflate"
                    };
                }
                catch (err) {
                    tiny_node_logger_1.default.error(`failed to deflate resource: ${filename}`, err);
                }
            this.watch(filename, url);
            if (resource.watch)
                for (const watched of resource.watch) {
                    const filename = path_1.default.relative(this.rootDir, watched);
                    this.watch(filename, url);
                }
            return resource;
        }));
        return this;
    }
    storeSourceMap(url, map) {
        const content = JSON.stringify(map);
        const questionMark = url.indexOf("?");
        if (questionMark > 0) {
            url = url.substring(0, questionMark);
        }
        // @ts-ignore
        super.set(url + ".map", Promise.resolve({
            content: content,
            headers: {
                "content-type": mime_types_1.JSON_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            }
        }));
    }
}
exports.ResourceCache = ResourceCache;
//# sourceMappingURL=resource-cache.js.map