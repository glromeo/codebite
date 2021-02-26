"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = exports.NO_QUERY = exports.NO_LINKS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fs_1 = require("fs");
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const hmr_server_1 = require("../hmr-server");
const transformers_1 = require("../transformers");
const mime_types_1 = require("../util/mime-types");
const zlib_1 = require("../util/zlib");
const router_1 = require("./router");
exports.NO_LINKS = Object.freeze([]);
exports.NO_QUERY = Object.freeze({});
/*
 * NOTE: cache & hmr have two very distinct roles, cache won't invalidate an entry because the dependents
 */
class MultiMap extends Map {
    add(key, value) {
        let set = super.get(key);
        if (set === undefined) {
            set = new Set();
            super.set(key, set);
        }
        set.add(value);
        return this;
    }
    remove(key, value) {
        let set = super.get(key);
        if (set === undefined) {
            return;
        }
        set.delete(value);
        return this;
    }
}
exports.useResourceProvider = pico_memoize_1.default(function (options, watcher) {
    const cache = new Map();
    const watched = new MultiMap();
    const dependants = new MultiMap();
    const hmr = hmr_server_1.useHotModuleReplacement(options);
    function watch(filename, url) {
        if (!watched.has(filename)) {
            watcher.add(filename);
        }
        watched.add(filename, url);
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
        if (urls)
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
                if (hmr.engine.getEntry(url)) {
                    hmr.engine.broadcastMessage({ type: "update", url, bubbled: false });
                    // updateOrBubble(url, new Set());
                    return;
                }
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
                    if (hmr.engine && resource.links) {
                        for (const link of resource.links) {
                            hmr.engine.addRelationship(url, link);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUUxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdFQUFtQztBQUNuQyx3RUFBbUM7QUFFbkMsOENBQXNEO0FBQ3RELGtEQUEyRDtBQUMzRCxtREFBa0U7QUFDbEUsdUNBQXFDO0FBQ3JDLHFDQUFtQztBQWdCdEIsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixRQUFBLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTFDOztHQUVHO0FBRUgsTUFBTSxRQUFlLFNBQVEsR0FBYztJQUV2QyxHQUFHLENBQUMsR0FBTSxFQUFFLEtBQVE7UUFDaEIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7WUFDbkIsR0FBRyxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFDbkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDdkI7UUFDRCxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2YsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFNLEVBQUUsS0FBUTtRQUNuQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtZQUNuQixPQUFPO1NBQ1Y7UUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDO0lB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RSxRQUFRLENBQUMsQ0FBQzthQUM1QjtZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ3BCLENBQUM7S0FDSixDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCB7RlNXYXRjaGVyfSBmcm9tIFwiY2hva2lkYXJcIjtcclxuaW1wb3J0IGV0YWcgZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3VzZUhvdE1vZHVsZVJlcGxhY2VtZW50fSBmcm9tIFwiLi4vaG1yLXNlcnZlclwiO1xyXG5pbXBvcnQge1NvdXJjZU1hcCwgdXNlVHJhbnNmb3JtZXJzfSBmcm9tIFwiLi4vdHJhbnNmb3JtZXJzXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGUsIEpTT05fQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7dXNlWmxpYn0gZnJvbSBcIi4uL3V0aWwvemxpYlwiO1xyXG5pbXBvcnQge3VzZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgUXVlcnkgPSB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbmV4cG9ydCB0eXBlIFJlc291cmNlID0ge1xyXG4gICAgcGF0aG5hbWU6IHN0cmluZ1xyXG4gICAgcXVlcnk6IFF1ZXJ5XHJcbiAgICBmaWxlbmFtZTogc3RyaW5nXHJcbiAgICBjb250ZW50OiBzdHJpbmcgfCBCdWZmZXJcclxuICAgIGhlYWRlcnM6IE91dGdvaW5nSHR0cEhlYWRlcnNcclxuICAgIGxpbmtzOiByZWFkb25seSBzdHJpbmdbXVxyXG4gICAgd2F0Y2g/OiByZWFkb25seSBzdHJpbmdbXVxyXG4gICAgb25jaGFuZ2U/OiAoKSA9PiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBOT19MSU5LUyA9IE9iamVjdC5mcmVlemUoW10pO1xyXG5leHBvcnQgY29uc3QgTk9fUVVFUlkgPSBPYmplY3QuZnJlZXplKHt9KTtcclxuXHJcbi8qXHJcbiAqIE5PVEU6IGNhY2hlICYgaG1yIGhhdmUgdHdvIHZlcnkgZGlzdGluY3Qgcm9sZXMsIGNhY2hlIHdvbid0IGludmFsaWRhdGUgYW4gZW50cnkgYmVjYXVzZSB0aGUgZGVwZW5kZW50c1xyXG4gKi9cclxuXHJcbmNsYXNzIE11bHRpTWFwPEssIFQ+IGV4dGVuZHMgTWFwPEssIFNldDxUPj4ge1xyXG5cclxuICAgIGFkZChrZXk6IEssIHZhbHVlOiBUKSB7XHJcbiAgICAgICAgbGV0IHNldCA9IHN1cGVyLmdldChrZXkpO1xyXG4gICAgICAgIGlmIChzZXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBzZXQgPSBuZXcgU2V0PFQ+KCk7XHJcbiAgICAgICAgICAgIHN1cGVyLnNldChrZXksIHNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldC5hZGQodmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZShrZXk6IEssIHZhbHVlOiBUKSB7XHJcbiAgICAgICAgbGV0IHNldCA9IHN1cGVyLmdldChrZXkpO1xyXG4gICAgICAgIGlmIChzZXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldC5kZWxldGUodmFsdWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdXNlUmVzb3VyY2VQcm92aWRlciA9IG1lbW9pemUoZnVuY3Rpb24gKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsIHdhdGNoZXI6IEZTV2F0Y2hlcikge1xyXG5cclxuICAgIGNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFJlc291cmNlIHwgUHJvbWlzZTxSZXNvdXJjZT4+KCk7XHJcbiAgICBjb25zdCB3YXRjaGVkID0gbmV3IE11bHRpTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gICAgY29uc3QgZGVwZW5kYW50cyA9IG5ldyBNdWx0aU1hcDxzdHJpbmcsIHN0cmluZz4oKTtcclxuXHJcbiAgICBjb25zdCBobXIgPSB1c2VIb3RNb2R1bGVSZXBsYWNlbWVudChvcHRpb25zKTtcclxuXHJcbiAgICBmdW5jdGlvbiB3YXRjaChmaWxlbmFtZTogc3RyaW5nLCB1cmw6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghd2F0Y2hlZC5oYXMoZmlsZW5hbWUpKSB7XHJcbiAgICAgICAgICAgIHdhdGNoZXIuYWRkKGZpbGVuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2F0Y2hlZC5hZGQoZmlsZW5hbWUsIHVybCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW53YXRjaChmaWxlbmFtZTogc3RyaW5nLCB1cmw6IHN0cmluZyB8IG51bGwgPSBudWxsKSB7XHJcbiAgICAgICAgaWYgKHVybCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgdXJscyA9IHdhdGNoZWQuZ2V0KGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHVybHMpIHtcclxuICAgICAgICAgICAgICAgIHVybHMuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVybHMuc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdhdGNoZXIudW53YXRjaChmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3YXRjaGVkLmRlbGV0ZShmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHdhdGNoZXIudW53YXRjaChmaWxlbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdhdGNoZXIub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGZpbGVuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB1cmxzID0gd2F0Y2hlZC5nZXQoZmlsZW5hbWUpO1xyXG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwiY2hhbmdlOlwiLCBmaWxlbmFtZSwgXCItPlwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlKS50aGVuKHJlbG9hZCkudGhlbihwaXBlbGluZSkudGhlbihyZXNvdXJjZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvZy53YXJuKFwibm8gY2FjaGUgZW50cnkgZm9yOlwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgdW53YXRjaChmaWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaG1yLmVuZ2luZSEuZ2V0RW50cnkodXJsKSkge1xyXG4gICAgICAgICAgICAgICAgaG1yLmVuZ2luZSEuYnJvYWRjYXN0TWVzc2FnZSh7dHlwZTogXCJ1cGRhdGVcIiwgdXJsLCBidWJibGVkOiBmYWxzZX0pO1xyXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlT3JCdWJibGUodXJsLCBuZXcgU2V0KCkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2F0Y2hlci5vbihcInVubGlua1wiLCBmdW5jdGlvbiAoZXZlbnQsIGZpbGVuYW1lKSB7XHJcbiAgICAgICAgY29uc3QgdXJscyA9IHdhdGNoZWQuZ2V0KGZpbGVuYW1lKTtcclxuICAgICAgICBpZiAodXJscykgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoXCJ1bmxpbms6XCIsIGZpbGVuYW1lLCBcIi0+XCIsIHVybCk7XHJcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xyXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UgJiYgIShyZXNvdXJjZSBpbnN0YW5jZW9mIFByb21pc2UpKSB7XHJcbiAgICAgICAgICAgICAgICB1bndhdGNoKHJlc291cmNlLmZpbGVuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZS53YXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZW5hbWUgb2YgcmVzb3VyY2Uud2F0Y2gpIHVud2F0Y2goZmlsZW5hbWUsIHVybCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB1bndhdGNoKGZpbGVuYW1lKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHtyb3V0ZX0gPSB1c2VSb3V0ZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7c2hvdWxkVHJhbnNmb3JtLCB0cmFuc2Zvcm1Db250ZW50fSA9IHVzZVRyYW5zZm9ybWVycyhvcHRpb25zKTtcclxuICAgIGNvbnN0IHthcHBseUNvbXByZXNzaW9ufSA9IHVzZVpsaWIob3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgICAgICAgICBfICAgICAgICAgICAgXyBfXHJcbiAgICAgKiAgICAgICAgIChfKSAgICAgICAgICB8IChfKVxyXG4gICAgICogICAgXyBfXyAgXyBfIF9fICAgX19ffCB8XyBfIF9fICAgX19fXHJcbiAgICAgKiAgIHwgJ18gXFx8IHwgJ18gXFwgLyBfIFxcIHwgfCAnXyBcXCAvIF8gXFxcclxuICAgICAqICAgfCB8XykgfCB8IHxfKSB8ICBfXy8gfCB8IHwgfCB8ICBfXy9cclxuICAgICAqICAgfCAuX18vfF98IC5fXy8gXFxfX198X3xffF98IHxffFxcX19ffFxyXG4gICAgICogICB8IHwgICAgIHwgfFxyXG4gICAgICogICB8X3wgICAgIHxffFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSByZXNvdXJjZVxyXG4gICAgICovXHJcbiAgICBhc3luYyBmdW5jdGlvbiBwaXBlbGluZShyZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuICAgICAgICBpZiAoc2hvdWxkVHJhbnNmb3JtKHJlc291cmNlKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzb3VyY2VNYXAgPSBhd2FpdCB0cmFuc2Zvcm1Db250ZW50KHJlc291cmNlKTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZU1hcCkge1xyXG4gICAgICAgICAgICAgICAgc3RvcmVTb3VyY2VNYXAocmVzb3VyY2UuZmlsZW5hbWUsIHJlc291cmNlLnBhdGhuYW1lLCByZXNvdXJjZS5xdWVyeSwgc291cmNlTWFwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCBldGFnSGVhZGVyKHJlc291cmNlKTtcclxuICAgICAgICBpZiAob3B0aW9ucy5lbmNvZGluZykge1xyXG4gICAgICAgICAgICBhd2FpdCBjb21wcmVzc0NvbnRlbnQocmVzb3VyY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVTb3VyY2VNYXAoZmlsZW5hbWU6IHN0cmluZywgcGF0aG5hbWU6IHN0cmluZywgcXVlcnk6IFF1ZXJ5LCBtYXA/OiBTb3VyY2VNYXAgfCBudWxsKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhcHBseUNvbXByZXNzaW9uKEpTT04uc3RyaW5naWZ5KG1hcCksIFwiZGVmbGF0ZVwiKTtcclxuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBwYXRobmFtZSArIFwiLm1hcFwiO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcEZpbGVuYW1lID0gZmlsZW5hbWUgKyBcIi5tYXBcIjtcclxuXHJcbiAgICAgICAgY2FjaGUuc2V0KHNvdXJjZU1hcFVybCwge1xyXG4gICAgICAgICAgICBmaWxlbmFtZTogc291cmNlTWFwRmlsZW5hbWUsXHJcbiAgICAgICAgICAgIHBhdGhuYW1lOiBzb3VyY2VNYXBVcmwsXHJcbiAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogSlNPTl9DT05URU5UX1RZUEUsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IGNvbnRlbnQubGVuZ3RoLCAvLyBCdWZmZXIuYnl0ZUxlbmd0aChjb250ZW50KSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBcImRlZmxhdGVcIixcclxuICAgICAgICAgICAgICAgIFwibGFzdC1tb2RpZmllZFwiOiBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJuby1jYWNoZVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxpbmtzOiBOT19MSU5LU1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJlbG9hZChyZXNvdXJjZTogUmVzb3VyY2UpOiBQcm9taXNlPFJlc291cmNlPiB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KHJlc291cmNlLmZpbGVuYW1lKTtcclxuICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUocmVzb3VyY2UuZmlsZW5hbWUpO1xyXG4gICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSBjb250ZW50VHlwZShyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdID0gc3RhdHMuc2l6ZTtcclxuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wibGFzdC1tb2RpZmllZFwiXSA9IHN0YXRzLm10aW1lLnRvVVRDU3RyaW5nKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGV0YWdIZWFkZXIoe2hlYWRlcnMsIHBhdGhuYW1lfTogUmVzb3VyY2UpIHtcclxuICAgICAgICBoZWFkZXJzW1wiZXRhZ1wiXSA9IGV0YWcoYCR7cGF0aG5hbWV9ICR7aGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdfSAke2hlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdfWAsIG9wdGlvbnMuZXRhZyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NDb250ZW50KHJlc291cmNlOiBSZXNvdXJjZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSBhcHBseUNvbXByZXNzaW9uKHJlc291cmNlLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgLi4uKHJlc291cmNlLmhlYWRlcnMpLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiByZXNvdXJjZS5jb250ZW50Lmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBvcHRpb25zLmVuY29kaW5nXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZy5lcnJvcihgZmFpbGVkIHRvIGRlZmxhdGUgcmVzb3VyY2U6ICR7cmVzb3VyY2UuZmlsZW5hbWV9YCwgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBhc3luYyBwcm92aWRlUmVzb3VyY2UodXJsOiBzdHJpbmcpOiBQcm9taXNlPFJlc291cmNlPiB7XHJcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xyXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInJldHJpZXZlZCBmcm9tIGNhY2hlOlwiLCBjaGFsay5tYWdlbnRhKHVybCkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSByb3V0ZSh1cmwpLnRoZW4ocGlwZWxpbmUpLnRoZW4ocmVzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmNhY2hlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZS53YXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlbmFtZSBvZiByZXNvdXJjZS53YXRjaCkgd2F0Y2goZmlsZW5hbWUsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhtci5lbmdpbmUgJiYgcmVzb3VyY2UubGlua3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBsaW5rIG9mIHJlc291cmNlLmxpbmtzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBobXIuZW5naW5lLmFkZFJlbGF0aW9uc2hpcCh1cmwsIGxpbmspO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCByZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG5cclxuIl19