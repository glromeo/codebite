"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = exports.NO_QUERY = exports.NO_LINKS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const transformers_1 = require("../transformers");
const mime_types_1 = require("../util/mime-types");
const multi_map_1 = require("../util/multi-map");
const zlib_1 = require("../util/zlib");
const watcher_1 = require("../watcher");
const messaging_1 = require("../messaging");
const router_1 = require("./router");
exports.NO_LINKS = Object.freeze([]);
exports.NO_QUERY = Object.freeze({});
exports.useResourceProvider = nano_memoize_1.default(function (options) {
    const cache = new Map();
    const watched = new multi_map_1.MultiMap();
    const dependants = new multi_map_1.MultiMap();
    const ws = messaging_1.useMessaging(options);
    const watcher = watcher_1.useWatcher(options);
    function watch(filename, url) {
        const relative = path_1.default.relative(options.rootDir, filename);
        if (!watched.has(relative)) {
            watcher.add(relative);
        }
        watched.add(relative, url);
    }
    function unwatch(filename, url = null) {
        if (url !== null) {
            let urls = watched.get(filename);
            if (urls) {
                urls.delete(url);
                if (!urls.size) {
                    watcher.unwatch(filename);
                }
            }
        }
        else {
            watched.delete(filename);
            watcher.unwatch(filename);
        }
    }
    watcher.on("change", function (filename) {
        const urls = watched.get(filename);
        if (urls) {
            for (const url of urls) {
                const resource = cache.get(url);
                if (resource) {
                    tiny_node_logger_1.default.debug("change:", filename, "->", url);
                    cache.set(url, Promise.resolve(resource).then(reload).then(pipeline).then(resource => {
                        cache.set(url, resource);
                        return resource;
                    }));
                }
                else {
                    tiny_node_logger_1.default.warn("no cache entry for:", url);
                    unwatch(filename, url);
                }
                ws.broadcast("hmr:update", { url });
            }
        }
        else {
            tiny_node_logger_1.default.warn("no urls for filename:", filename);
            unwatch(filename);
        }
    });
    watcher.on("unlink", function (event, filename) {
        const urls = watched.get(filename);
        if (urls)
            for (const url of urls) {
                tiny_node_logger_1.default.debug("unlink:", filename, "->", url);
                let resource = cache.get(url);
                if (resource && !(resource instanceof Promise)) {
                    unwatch(resource.filename);
                    if (resource.watch) {
                        for (const filename of resource.watch)
                            unwatch(filename, url);
                    }
                    cache.delete(url);
                }
            }
        unwatch(filename);
    });
    const { route } = router_1.useRouter(options);
    const { shouldTransform, transformContent } = transformers_1.useTransformers(options);
    const { applyCompression } = zlib_1.useZlib(options);
    /**
     *          _            _ _
     *         (_)          | (_)
     *    _ __  _ _ __   ___| |_ _ __   ___
     *   | '_ \| | '_ \ / _ \ | | '_ \ / _ \
     *   | |_) | | |_) |  __/ | | | | |  __/
     *   | .__/|_| .__/ \___|_|_|_| |_|\___|
     *   | |     | |
     *   |_|     |_|
     *
     * @param resource
     */
    async function pipeline(resource) {
        if (shouldTransform(resource)) {
            const sourceMap = await transformContent(resource);
            if (sourceMap) {
                storeSourceMap(resource.filename, resource.pathname, resource.query, sourceMap);
            }
        }
        await etagHeader(resource);
        if (options.encoding) {
            await compressContent(resource);
        }
        return resource;
    }
    function storeSourceMap(filename, pathname, query, map) {
        const content = applyCompression(JSON.stringify(map), "deflate");
        const sourceMapUrl = pathname + ".map";
        const sourceMapFilename = filename + ".map";
        cache.set(sourceMapUrl, {
            filename: sourceMapFilename,
            pathname: sourceMapUrl,
            query: query,
            content: content,
            headers: {
                "content-type": mime_types_1.JSON_CONTENT_TYPE,
                "content-length": content.length,
                "content-encoding": "deflate",
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            },
            links: exports.NO_LINKS
        });
    }
    async function reload(resource) {
        const stats = await fs_1.promises.stat(resource.filename);
        resource.content = await fs_1.promises.readFile(resource.filename);
        resource.headers["content-type"] = mime_types_1.contentType(resource.filename);
        resource.headers["content-length"] = stats.size;
        resource.headers["last-modified"] = stats.mtime.toUTCString();
        return resource;
    }
    async function etagHeader({ headers, pathname }) {
        headers["etag"] = etag_1.default(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
    }
    async function compressContent(resource) {
        try {
            resource.content = applyCompression(resource.content);
            resource.headers = {
                ...(resource.headers),
                "content-length": resource.content.length,
                "content-encoding": options.encoding
            };
        }
        catch (err) {
            tiny_node_logger_1.default.error(`failed to deflate resource: ${resource.filename}`, err);
        }
    }
    return {
        async provideResource(url) {
            let resource = cache.get(url);
            if (resource) {
                tiny_node_logger_1.default.debug("retrieved from cache:", chalk_1.default.magenta(url));
            }
            else {
                resource = route(url).then(pipeline).then(resource => {
                    if (options.cache) {
                        cache.set(url, resource);
                        watch(resource.filename, url);
                        if (resource.watch) {
                            for (const filename of resource.watch)
                                watch(filename, url);
                        }
                    }
                    return resource;
                }).finally(function () {
                    if (!options.cache) {
                        cache.delete(url);
                    }
                });
                cache.set(url, resource);
            }
            return resource;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdFQUFvQztBQUNwQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLGtEQUEyRDtBQUMzRCxtREFBa0U7QUFDbEUsaURBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyx3Q0FBc0M7QUFDdEMsNENBQTBDO0FBQzFDLHFDQUFtQztBQWdCdEIsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixRQUFBLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTdCLFFBQUEsbUJBQW1CLEdBQUcsc0JBQVEsQ0FBQyxVQUFVLE9BQXNCO0lBRXhFLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO0lBQzlELE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVEsRUFBa0IsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFRLEVBQWtCLENBQUM7SUFFbEQsTUFBTSxFQUFFLEdBQUcsd0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBRyxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBDLFNBQVMsS0FBSyxDQUFDLFFBQWdCLEVBQUUsR0FBVztRQUN4QyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6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Q0FBQzt3QkFDOUIsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFOzRCQUNoQixLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLO2dDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQy9EO3FCQUNKO29CQUNELE9BQU8sUUFBUSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7d0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQ3JCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcbmltcG9ydCBldGFnIGZyb20gXCJldGFnXCI7XG5pbXBvcnQge3Byb21pc2VzIGFzIGZzfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcbmltcG9ydCBtZW1vaXplZCBmcm9tIFwibmFuby1tZW1vaXplXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge1NvdXJjZU1hcCwgdXNlVHJhbnNmb3JtZXJzfSBmcm9tIFwiLi4vdHJhbnNmb3JtZXJzXCI7XG5pbXBvcnQge2NvbnRlbnRUeXBlLCBKU09OX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xuaW1wb3J0IHtNdWx0aU1hcH0gZnJvbSBcIi4uL3V0aWwvbXVsdGktbWFwXCI7XG5pbXBvcnQge3VzZVpsaWJ9IGZyb20gXCIuLi91dGlsL3psaWJcIjtcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4uL3dhdGNoZXJcIjtcbmltcG9ydCB7dXNlTWVzc2FnaW5nfSBmcm9tIFwiLi4vbWVzc2FnaW5nXCI7XG5pbXBvcnQge3VzZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XG5cblxuZXhwb3J0IHR5cGUgUXVlcnkgPSB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcblxuZXhwb3J0IHR5cGUgUmVzb3VyY2UgPSB7XG4gICAgcGF0aG5hbWU6IHN0cmluZ1xuICAgIHF1ZXJ5OiBRdWVyeVxuICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICBjb250ZW50OiBzdHJpbmcgfCBCdWZmZXJcbiAgICBoZWFkZXJzOiBPdXRnb2luZ0h0dHBIZWFkZXJzXG4gICAgbGlua3M6IHJlYWRvbmx5IHN0cmluZ1tdXG4gICAgd2F0Y2g/OiByZWFkb25seSBzdHJpbmdbXVxuICAgIG9uY2hhbmdlPzogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgY29uc3QgTk9fTElOS1MgPSBPYmplY3QuZnJlZXplKFtdKTtcbmV4cG9ydCBjb25zdCBOT19RVUVSWSA9IE9iamVjdC5mcmVlemUoe30pO1xuXG5leHBvcnQgY29uc3QgdXNlUmVzb3VyY2VQcm92aWRlciA9IG1lbW9pemVkKGZ1bmN0aW9uIChvcHRpb25zOiBFU05leHRPcHRpb25zKSB7XG5cbiAgICBjb25zdCBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBSZXNvdXJjZSB8IFByb21pc2U8UmVzb3VyY2U+PigpO1xuICAgIGNvbnN0IHdhdGNoZWQgPSBuZXcgTXVsdGlNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgY29uc3QgZGVwZW5kYW50cyA9IG5ldyBNdWx0aU1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIGNvbnN0IHdzID0gdXNlTWVzc2FnaW5nKG9wdGlvbnMpO1xuICAgIGNvbnN0IHdhdGNoZXIgPSB1c2VXYXRjaGVyKG9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gd2F0Y2goZmlsZW5hbWU6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcmVsYXRpdmUgPSBwYXRoLnJlbGF0aXZlKG9wdGlvbnMucm9vdERpciwgZmlsZW5hbWUpO1xuICAgICAgICBpZiAoIXdhdGNoZWQuaGFzKHJlbGF0aXZlKSkge1xuICAgICAgICAgICAgd2F0Y2hlci5hZGQocmVsYXRpdmUpO1xuICAgICAgICB9XG4gICAgICAgIHdhdGNoZWQuYWRkKHJlbGF0aXZlLCB1cmwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVud2F0Y2goZmlsZW5hbWU6IHN0cmluZywgdXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbCkge1xuICAgICAgICBpZiAodXJsICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgdXJscyA9IHdhdGNoZWQuZ2V0KGZpbGVuYW1lKTtcbiAgICAgICAgICAgIGlmICh1cmxzKSB7XG4gICAgICAgICAgICAgICAgdXJscy5kZWxldGUodXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoIXVybHMuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB3YXRjaGVyLnVud2F0Y2goZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdhdGNoZWQuZGVsZXRlKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIHdhdGNoZXIudW53YXRjaChmaWxlbmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3YXRjaGVyLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChmaWxlbmFtZSk7XG4gICAgICAgIGlmICh1cmxzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBjYWNoZS5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiY2hhbmdlOlwiLCBmaWxlbmFtZSwgXCItPlwiLCB1cmwpO1xuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCBQcm9taXNlLnJlc29sdmUocmVzb3VyY2UpLnRoZW4ocmVsb2FkKS50aGVuKHBpcGVsaW5lKS50aGVuKHJlc291cmNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy53YXJuKFwibm8gY2FjaGUgZW50cnkgZm9yOlwiLCB1cmwpO1xuICAgICAgICAgICAgICAgICAgICB1bndhdGNoKGZpbGVuYW1lLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3cy5icm9hZGNhc3QoXCJobXI6dXBkYXRlXCIsIHt1cmx9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZy53YXJuKFwibm8gdXJscyBmb3IgZmlsZW5hbWU6XCIsIGZpbGVuYW1lKTtcbiAgICAgICAgICAgIHVud2F0Y2goZmlsZW5hbWUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB3YXRjaGVyLm9uKFwidW5saW5rXCIsIGZ1bmN0aW9uIChldmVudCwgZmlsZW5hbWUpIHtcbiAgICAgICAgY29uc3QgdXJscyA9IHdhdGNoZWQuZ2V0KGZpbGVuYW1lKTtcbiAgICAgICAgaWYgKHVybHMpIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInVubGluazpcIiwgZmlsZW5hbWUsIFwiLT5cIiwgdXJsKTtcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xuICAgICAgICAgICAgaWYgKHJlc291cmNlICYmICEocmVzb3VyY2UgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xuICAgICAgICAgICAgICAgIHVud2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZS53YXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIHJlc291cmNlLndhdGNoKSB1bndhdGNoKGZpbGVuYW1lLCB1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB1bndhdGNoKGZpbGVuYW1lKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHtyb3V0ZX0gPSB1c2VSb3V0ZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge3Nob3VsZFRyYW5zZm9ybSwgdHJhbnNmb3JtQ29udGVudH0gPSB1c2VUcmFuc2Zvcm1lcnMob3B0aW9ucyk7XG4gICAgY29uc3Qge2FwcGx5Q29tcHJlc3Npb259ID0gdXNlWmxpYihvcHRpb25zKTtcblxuICAgIC8qKlxuICAgICAqICAgICAgICAgIF8gICAgICAgICAgICBfIF9cbiAgICAgKiAgICAgICAgIChfKSAgICAgICAgICB8IChfKVxuICAgICAqICAgIF8gX18gIF8gXyBfXyAgIF9fX3wgfF8gXyBfXyAgIF9fX1xuICAgICAqICAgfCAnXyBcXHwgfCAnXyBcXCAvIF8gXFwgfCB8ICdfIFxcIC8gXyBcXFxuICAgICAqICAgfCB8XykgfCB8IHxfKSB8ICBfXy8gfCB8IHwgfCB8ICBfXy9cbiAgICAgKiAgIHwgLl9fL3xffCAuX18vIFxcX19ffF98X3xffCB8X3xcXF9fX3xcbiAgICAgKiAgIHwgfCAgICAgfCB8XG4gICAgICogICB8X3wgICAgIHxffFxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc291cmNlXG4gICAgICovXG4gICAgYXN5bmMgZnVuY3Rpb24gcGlwZWxpbmUocmVzb3VyY2U6IFJlc291cmNlKSB7XG4gICAgICAgIGlmIChzaG91bGRUcmFuc2Zvcm0ocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VNYXAgPSBhd2FpdCB0cmFuc2Zvcm1Db250ZW50KHJlc291cmNlKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VNYXApIHtcbiAgICAgICAgICAgICAgICBzdG9yZVNvdXJjZU1hcChyZXNvdXJjZS5maWxlbmFtZSwgcmVzb3VyY2UucGF0aG5hbWUsIHJlc291cmNlLnF1ZXJ5LCBzb3VyY2VNYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGV0YWdIZWFkZXIocmVzb3VyY2UpO1xuICAgICAgICBpZiAob3B0aW9ucy5lbmNvZGluZykge1xuICAgICAgICAgICAgYXdhaXQgY29tcHJlc3NDb250ZW50KHJlc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcmVTb3VyY2VNYXAoZmlsZW5hbWU6IHN0cmluZywgcGF0aG5hbWU6IHN0cmluZywgcXVlcnk6IFF1ZXJ5LCBtYXA/OiBTb3VyY2VNYXAgfCBudWxsKSB7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24oSlNPTi5zdHJpbmdpZnkobWFwKSwgXCJkZWZsYXRlXCIpO1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBwYXRobmFtZSArIFwiLm1hcFwiO1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBGaWxlbmFtZSA9IGZpbGVuYW1lICsgXCIubWFwXCI7XG5cbiAgICAgICAgY2FjaGUuc2V0KHNvdXJjZU1hcFVybCwge1xuICAgICAgICAgICAgZmlsZW5hbWU6IHNvdXJjZU1hcEZpbGVuYW1lLFxuICAgICAgICAgICAgcGF0aG5hbWU6IHNvdXJjZU1hcFVybCxcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSlNPTl9DT05URU5UX1RZUEUsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBjb250ZW50Lmxlbmd0aCwgLy8gQnVmZmVyLmJ5dGVMZW5ndGgoY29udGVudCksXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IFwiZGVmbGF0ZVwiLFxuICAgICAgICAgICAgICAgIFwibGFzdC1tb2RpZmllZFwiOiBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwibm8tY2FjaGVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpbmtzOiBOT19MSU5LU1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiByZWxvYWQocmVzb3VyY2U6IFJlc291cmNlKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xuICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnN0YXQocmVzb3VyY2UuZmlsZW5hbWUpO1xuICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUocmVzb3VyY2UuZmlsZW5hbWUpO1xuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gY29udGVudFR5cGUocmVzb3VyY2UuZmlsZW5hbWUpO1xuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl0gPSBzdGF0cy5zaXplO1xuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wibGFzdC1tb2RpZmllZFwiXSA9IHN0YXRzLm10aW1lLnRvVVRDU3RyaW5nKCk7XG4gICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBldGFnSGVhZGVyKHtoZWFkZXJzLCBwYXRobmFtZX06IFJlc291cmNlKSB7XG4gICAgICAgIGhlYWRlcnNbXCJldGFnXCJdID0gZXRhZyhgJHtwYXRobmFtZX0gJHtoZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl19ICR7aGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl19YCwgb3B0aW9ucy5ldGFnKTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0NvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gYXBwbHlDb21wcmVzc2lvbihyZXNvdXJjZS5jb250ZW50KTtcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgLi4uKHJlc291cmNlLmhlYWRlcnMpLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogcmVzb3VyY2UuY29udGVudC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IG9wdGlvbnMuZW5jb2RpbmdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLmVycm9yKGBmYWlsZWQgdG8gZGVmbGF0ZSByZXNvdXJjZTogJHtyZXNvdXJjZS5maWxlbmFtZX1gLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXN5bmMgcHJvdmlkZVJlc291cmNlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xuICAgICAgICAgICAgbGV0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XG4gICAgICAgICAgICBpZiAocmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJyZXRyaWV2ZWQgZnJvbSBjYWNoZTpcIiwgY2hhbGsubWFnZW50YSh1cmwpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSByb3V0ZSh1cmwpLnRoZW4ocGlwZWxpbmUpLnRoZW4ocmVzb3VyY2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5jYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2Uud2F0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIHJlc291cmNlLndhdGNoKSB3YXRjaChmaWxlbmFtZSwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuIl19