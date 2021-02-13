"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCache = void 0;
const mime_types_1 = require("./mime-types");
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const fast_url_parser_1 = require("fast-url-parser");
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
    set(url, resource) {
        const filename = path_1.default.relative(this.rootDir, resource.filename);
        this.watch(filename, url);
        if (resource.watch)
            for (const watched of resource.watch) {
                const filename = path_1.default.relative(this.rootDir, watched);
                this.watch(filename, url);
            }
        return super.set(url, resource);
    }
    storeSourceMap(url, map) {
        const content = JSON.stringify(map);
        const { pathname, query } = fast_url_parser_1.parse(url, true);
        const filename = pathname + ".map";
        return super.set(filename, {
            filename,
            pathname,
            query,
            content: content,
            headers: {
                "content-type": mime_types_1.JSON_CONTENT_TYPE,
                "content-length": Buffer.byteLength(content),
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            }
        });
    }
}
exports.ResourceCache = ResourceCache;
//# sourceMappingURL=resource-cache.js.map