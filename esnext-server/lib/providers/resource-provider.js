"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = exports.NO_QUERY = exports.NO_LINKS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
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
exports.useResourceProvider = pico_memoize_1.default(function (options, watcher) {
    const cache = new Map();
    const watched = new Map();
    const hmr = hmr_server_1.useHotModuleReplacement(options);
    function store(url, resource) {
        if (options.cache) {
            cache.set(url, resource);
            watch(resource.filename, url);
            if (resource.watch) {
                for (const watched of resource.watch)
                    watch(watched, url);
            }
        }
        if (hmr.engine && resource.links) {
            for (const link of resource.links) {
                hmr.engine.addRelationship(url, link);
            }
        }
    }
    function discard(url, resource) {
        if (cache) {
            cache.delete(url);
        }
        if (hmr.engine && resource.links) {
            for (const link of resource.links) {
                hmr.engine.removeRelationship(url, link);
            }
        }
    }
    function watch(filename, url) {
        const pathname = path_1.default.relative(options.rootDir, filename);
        let urls = watched.get(pathname);
        if (urls) {
            urls.add(url);
        }
        else {
            urls = new Set().add(url);
            watched.set(pathname, urls);
            watcher.add(pathname);
        }
        return urls;
    }
    function unwatch(path) {
        watched.delete(path);
        watcher.unwatch(path);
    }
    function updateOrBubble(url, visited) {
        if (visited.has(url)) {
            return;
        }
        const node = hmr.engine.getEntry(url);
        const isBubbled = visited.size > 0;
        if (node && node.isHmrEnabled) {
            hmr.engine.broadcastMessage({ type: 'update', url, bubbled: isBubbled });
        }
        visited.add(url);
        if (node && node.isHmrAccepted) {
            // Found a boundary, no bubbling needed
        }
        else if (node && node.dependents.size > 0) {
            node.dependents.forEach((dep) => {
                hmr.engine.markEntryForReplacement(node, true);
                updateOrBubble(dep, visited);
            });
        }
        else {
            // We've reached the top, trigger a full page refresh
            hmr.engine.broadcastMessage({ type: 'reload' });
        }
    }
    watcher.on("change", function (path) {
        const urls = watched.get(path);
        if (urls)
            for (const url of urls) {
                reload(url, path);
                if (hmr.engine.getEntry(url)) {
                    hmr.engine.broadcastMessage({ type: 'update', url, bubbled: false });
                    // updateOrBubble(url, new Set());
                    return;
                }
            }
    });
    watcher.on("unlink", function (event, path) {
        const urls = watched.get(path);
        if (urls)
            for (const url of urls) {
                tiny_node_logger_1.default.debug("invalidate", path, "flush", url);
                cache.delete(url);
            }
        unwatch(path);
    });
    async function reload(url, path) {
        const resource = cache.get(url);
        if (resource) {
            cache.set(url, Promise.resolve(resource).then(async (resource) => {
                const stats = await fs_1.promises.stat(resource.filename);
                resource.content = await fs_1.promises.readFile(resource.filename);
                resource.headers["content-type"] = mime_types_1.contentType(resource.filename);
                resource.headers["content-length"] = stats.size;
                resource.headers["last-modified"] = stats.mtime.toUTCString();
                return pipeline(resource);
            }).then(resource => {
                cache.set(url, resource);
                return resource;
            }));
        }
        else {
            tiny_node_logger_1.default.warn("no cache entry for:", url);
            unwatch(path);
        }
    }
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
     * @param url
     */
    async function provideResource(url) {
        const resource = await route(url);
        return pipeline(resource);
    }
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
                resource = provideResource(url).then(resource => {
                    store(url, resource);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUUxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdEQUF3QjtBQUN4QixnRUFBbUM7QUFDbkMsd0VBQW1DO0FBRW5DLDhDQUFzRDtBQUN0RCxrREFBMkQ7QUFDM0QsbURBQWtFO0FBQ2xFLHVDQUFxQztBQUNyQyxxQ0FBbUM7QUFnQnRCLFFBQUEsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUUxQzs7R0FFRztBQUVVLFFBQUEsbUJBQW1CLEdBQUcsc0JBQU8sQ0FBQyxVQUFVLE9BQXNCLEVBQUUsT0FBa0I7SUFFM0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7SUFDOUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7SUFDL0MsTUFBTSxHQUFHLEdBQUcsb0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0MsU0FBUyxLQUFLLENBQUMsR0FBVyxFQUFFLFFBQWtCO1FBRTFDLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtZQUNmLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTtnQkFDaEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsS0FBSztvQkFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzdEO1NBQ0o7UUFFRCxJQUFJ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UUFBUSxFQUFFO2dCQUNWLDBCQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUMxRDtpQkFBTTtnQkFDSCxRQUFRLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDNUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDckIsT0FBTyxRQUFRLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTt3QkFDaEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDckI7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDNUI7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNwQixDQUFDO0tBQ0osQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gXCJjaGFsa1wiO1xyXG5pbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCBldGFnIGZyb20gXCJldGFnXCI7XHJcbmltcG9ydCB7cHJvbWlzZXMgYXMgZnN9IGZyb20gXCJmc1wiO1xyXG5pbXBvcnQge091dGdvaW5nSHR0cEhlYWRlcnN9IGZyb20gXCJodHRwXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBtZW1vaXplIGZyb20gXCJwaWNvLW1lbW9pemVcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHt1c2VIb3RNb2R1bGVSZXBsYWNlbWVudH0gZnJvbSBcIi4uL2htci1zZXJ2ZXJcIjtcclxuaW1wb3J0IHtTb3VyY2VNYXAsIHVzZVRyYW5zZm9ybWVyc30gZnJvbSBcIi4uL3RyYW5zZm9ybWVyc1wiO1xyXG5pbXBvcnQge2NvbnRlbnRUeXBlLCBKU09OX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge3VzZVpsaWJ9IGZyb20gXCIuLi91dGlsL3psaWJcIjtcclxuaW1wb3J0IHt1c2VSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFF1ZXJ5ID0geyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XHJcblxyXG5leHBvcnQgdHlwZSBSZXNvdXJjZSA9IHtcclxuICAgIHBhdGhuYW1lOiBzdHJpbmdcclxuICAgIHF1ZXJ5OiBRdWVyeVxyXG4gICAgZmlsZW5hbWU6IHN0cmluZ1xyXG4gICAgY29udGVudDogc3RyaW5nIHwgQnVmZmVyXHJcbiAgICBoZWFkZXJzOiBPdXRnb2luZ0h0dHBIZWFkZXJzXHJcbiAgICBsaW5rczogcmVhZG9ubHkgc3RyaW5nW11cclxuICAgIHdhdGNoPzogSXRlcmFibGU8c3RyaW5nPlxyXG4gICAgb25jaGFuZ2U/OiAoKSA9PiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBOT19MSU5LUyA9IE9iamVjdC5mcmVlemUoW10pO1xyXG5leHBvcnQgY29uc3QgTk9fUVVFUlkgPSBPYmplY3QuZnJlZXplKHt9KTtcclxuXHJcbi8qXHJcbiAqIE5PVEU6IGNhY2hlICYgaG1yIGhhdmUgdHdvIHZlcnkgZGlzdGluY3Qgcm9sZXMsIGNhY2hlIHdvbid0IGludmFsaWRhdGUgYW4gZW50cnkgYmVjYXVzZSB0aGUgZGVwZW5kZW50c1xyXG4gKi9cclxuXHJcbmV4cG9ydCBjb25zdCB1c2VSZXNvdXJjZVByb3ZpZGVyID0gbWVtb2l6ZShmdW5jdGlvbiAob3B0aW9uczogRVNOZXh0T3B0aW9ucywgd2F0Y2hlcjogRlNXYXRjaGVyKSB7XHJcblxyXG4gICAgY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUmVzb3VyY2UgfCBQcm9taXNlPFJlc291cmNlPj4oKTtcclxuICAgIGNvbnN0IHdhdGNoZWQgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XHJcbiAgICBjb25zdCBobXIgPSB1c2VIb3RNb2R1bGVSZXBsYWNlbWVudChvcHRpb25zKTtcclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZSh1cmw6IHN0cmluZywgcmVzb3VyY2U6IFJlc291cmNlKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLmNhY2hlKSB7XHJcbiAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcclxuICAgICAgICAgICAgd2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUsIHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS53YXRjaCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YXRjaGVkIG9mIHJlc291cmNlLndhdGNoKSB3YXRjaCh3YXRjaGVkLCB1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaG1yLmVuZ2luZSAmJiByZXNvdXJjZS5saW5rcykge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgcmVzb3VyY2UubGlua3MpIHtcclxuICAgICAgICAgICAgICAgIGhtci5lbmdpbmUuYWRkUmVsYXRpb25zaGlwKHVybCwgbGluayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGlzY2FyZCh1cmw6IHN0cmluZywgcmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgaWYgKGNhY2hlKSB7XHJcbiAgICAgICAgICAgIGNhY2hlLmRlbGV0ZSh1cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaG1yLmVuZ2luZSAmJiByZXNvdXJjZS5saW5rcykge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgcmVzb3VyY2UubGlua3MpIHtcclxuICAgICAgICAgICAgICAgIGhtci5lbmdpbmUucmVtb3ZlUmVsYXRpb25zaGlwKHVybCwgbGluayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2F0Y2goZmlsZW5hbWUsIHVybCk6IFNldDxzdHJpbmc+IHtcclxuICAgICAgICBjb25zdCBwYXRobmFtZSA9IHBhdGgucmVsYXRpdmUob3B0aW9ucy5yb290RGlyLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgbGV0IHVybHMgPSB3YXRjaGVkLmdldChwYXRobmFtZSk7XHJcbiAgICAgICAgaWYgKHVybHMpIHtcclxuICAgICAgICAgICAgdXJscy5hZGQodXJsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1cmxzID0gbmV3IFNldDxzdHJpbmc+KCkuYWRkKHVybCk7XHJcbiAgICAgICAgICAgIHdhdGNoZWQuc2V0KHBhdGhuYW1lLCB1cmxzKTtcclxuICAgICAgICAgICAgd2F0Y2hlci5hZGQocGF0aG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdXJscztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1bndhdGNoKHBhdGgpIHtcclxuICAgICAgICB3YXRjaGVkLmRlbGV0ZShwYXRoKTtcclxuICAgICAgICB3YXRjaGVyLnVud2F0Y2gocGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlT3JCdWJibGUodXJsOiBzdHJpbmcsIHZpc2l0ZWQ6IFNldDxzdHJpbmc+KSB7XHJcbiAgICAgICAgaWYgKHZpc2l0ZWQuaGFzKHVybCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBub2RlID0gaG1yLmVuZ2luZSEuZ2V0RW50cnkodXJsKTtcclxuICAgICAgICBjb25zdCBpc0J1YmJsZWQgPSB2aXNpdGVkLnNpemUgPiAwO1xyXG4gICAgICAgIGlmIChub2RlICYmIG5vZGUuaXNIbXJFbmFibGVkKSB7XHJcbiAgICAgICAgICAgIGhtci5lbmdpbmUhLmJyb2FkY2FzdE1lc3NhZ2Uoe3R5cGU6ICd1cGRhdGUnLCB1cmwsIGJ1YmJsZWQ6IGlzQnViYmxlZH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2aXNpdGVkLmFkZCh1cmwpO1xyXG4gICAgICAgIGlmIChub2RlICYmIG5vZGUuaXNIbXJBY2NlcHRlZCkge1xyXG4gICAgICAgICAgICAvLyBGb3VuZCBhIGJvdW5kYXJ5LCBubyBidWJibGluZyBuZWVkZWRcclxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUgJiYgbm9kZS5kZXBlbmRlbnRzLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgIG5vZGUuZGVwZW5kZW50cy5mb3JFYWNoKChkZXApID0+IHtcclxuICAgICAgICAgICAgICAgIGhtci5lbmdpbmUhLm1hcmtFbnRyeUZvclJlcGxhY2VtZW50KG5vZGUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlT3JCdWJibGUoZGVwLCB2aXNpdGVkKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gV2UndmUgcmVhY2hlZCB0aGUgdG9wLCB0cmlnZ2VyIGEgZnVsbCBwYWdlIHJlZnJlc2hcclxuICAgICAgICAgICAgaG1yLmVuZ2luZSEuYnJvYWRjYXN0TWVzc2FnZSh7dHlwZTogJ3JlbG9hZCd9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2F0Y2hlci5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAocGF0aCkge1xyXG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChwYXRoKTtcclxuICAgICAgICBpZiAodXJscykgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICByZWxvYWQodXJsLCBwYXRoKTtcclxuICAgICAgICAgICAgaWYgKGhtci5lbmdpbmUhLmdldEVudHJ5KHVybCkpIHtcclxuICAgICAgICAgICAgICAgIGhtci5lbmdpbmUhLmJyb2FkY2FzdE1lc3NhZ2Uoe3R5cGU6ICd1cGRhdGUnLCB1cmwsIGJ1YmJsZWQ6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGVPckJ1YmJsZSh1cmwsIG5ldyBTZXQoKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB3YXRjaGVyLm9uKFwidW5saW5rXCIsIGZ1bmN0aW9uIChldmVudCwgcGF0aCkge1xyXG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChwYXRoKTtcclxuICAgICAgICBpZiAodXJscykgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoXCJpbnZhbGlkYXRlXCIsIHBhdGgsIFwiZmx1c2hcIiwgdXJsKTtcclxuICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHVud2F0Y2gocGF0aCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiByZWxvYWQodXJsOnN0cmluZywgcGF0aDpzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xyXG4gICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICBjYWNoZS5zZXQodXJsLCBQcm9taXNlLnJlc29sdmUocmVzb3VyY2UpLnRoZW4oYXN5bmMgcmVzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KHJlc291cmNlLmZpbGVuYW1lKTtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gY29udGVudFR5cGUocmVzb3VyY2UuZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdID0gc3RhdHMuc2l6ZTtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdID0gc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwaXBlbGluZShyZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nLndhcm4oXCJubyBjYWNoZSBlbnRyeSBmb3I6XCIsIHVybCk7XHJcbiAgICAgICAgICAgIHVud2F0Y2gocGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHtyb3V0ZX0gPSB1c2VSb3V0ZXIob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7c2hvdWxkVHJhbnNmb3JtLCB0cmFuc2Zvcm1Db250ZW50fSA9IHVzZVRyYW5zZm9ybWVycyhvcHRpb25zKTtcclxuICAgIGNvbnN0IHthcHBseUNvbXByZXNzaW9ufSA9IHVzZVpsaWIob3B0aW9ucyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgICAgICAgICBfICAgICAgICAgICAgXyBfXHJcbiAgICAgKiAgICAgICAgIChfKSAgICAgICAgICB8IChfKVxyXG4gICAgICogICAgXyBfXyAgXyBfIF9fICAgX19ffCB8XyBfIF9fICAgX19fXHJcbiAgICAgKiAgIHwgJ18gXFx8IHwgJ18gXFwgLyBfIFxcIHwgfCAnXyBcXCAvIF8gXFxcclxuICAgICAqICAgfCB8XykgfCB8IHxfKSB8ICBfXy8gfCB8IHwgfCB8ICBfXy9cclxuICAgICAqICAgfCAuX18vfF98IC5fXy8gXFxfX198X3xffF98IHxffFxcX19ffFxyXG4gICAgICogICB8IHwgICAgIHwgfFxyXG4gICAgICogICB8X3wgICAgIHxffFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB1cmxcclxuICAgICAqL1xyXG4gICAgYXN5bmMgZnVuY3Rpb24gcHJvdmlkZVJlc291cmNlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgcm91dGUodXJsKTtcclxuICAgICAgICByZXR1cm4gcGlwZWxpbmUocmVzb3VyY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHBpcGVsaW5lKHJlc291cmNlOiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGlmIChzaG91bGRUcmFuc2Zvcm0ocmVzb3VyY2UpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZU1hcCA9IGF3YWl0IHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlTWFwKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yZVNvdXJjZU1hcChyZXNvdXJjZS5maWxlbmFtZSwgcmVzb3VyY2UucGF0aG5hbWUsIHJlc291cmNlLnF1ZXJ5LCBzb3VyY2VNYXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IGV0YWdIZWFkZXIocmVzb3VyY2UpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzQ29udGVudChyZXNvdXJjZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVNvdXJjZU1hcChmaWxlbmFtZTogc3RyaW5nLCBwYXRobmFtZTogc3RyaW5nLCBxdWVyeTogUXVlcnksIG1hcD86IFNvdXJjZU1hcCB8IG51bGwpIHtcclxuXHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24oSlNPTi5zdHJpbmdpZnkobWFwKSwgXCJkZWZsYXRlXCIpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IHBhdGhuYW1lICsgXCIubWFwXCI7XHJcbiAgICAgICAgY29uc3Qgc291cmNlTWFwRmlsZW5hbWUgPSBmaWxlbmFtZSArIFwiLm1hcFwiO1xyXG5cclxuICAgICAgICBjYWNoZS5zZXQoc291cmNlTWFwVXJsLCB7XHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzb3VyY2VNYXBGaWxlbmFtZSxcclxuICAgICAgICAgICAgcGF0aG5hbWU6IHNvdXJjZU1hcFVybCxcclxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxyXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKU09OX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogY29udGVudC5sZW5ndGgsIC8vIEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IFwiZGVmbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZXRhZ0hlYWRlcih7aGVhZGVycywgcGF0aG5hbWV9OiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGhlYWRlcnNbXCJldGFnXCJdID0gZXRhZyhgJHtwYXRobmFtZX0gJHtoZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl19ICR7aGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl19YCwgb3B0aW9ucy5ldGFnKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0NvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24ocmVzb3VyY2UuY29udGVudCk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi4ocmVzb3VyY2UuaGVhZGVycyksXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHJlc291cmNlLmNvbnRlbnQubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IG9wdGlvbnMuZW5jb2RpbmdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nLmVycm9yKGBmYWlsZWQgdG8gZGVmbGF0ZSByZXNvdXJjZTogJHtyZXNvdXJjZS5maWxlbmFtZX1gLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFzeW5jIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuICAgICAgICAgICAgbGV0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwicmV0cmlldmVkIGZyb20gY2FjaGU6XCIsIGNoYWxrLm1hZ2VudGEodXJsKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSA9IHByb3ZpZGVSZXNvdXJjZSh1cmwpLnRoZW4ocmVzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlKHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcblxyXG4iXX0=