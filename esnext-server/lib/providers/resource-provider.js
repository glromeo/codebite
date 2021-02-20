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
    watcher.on("change", function (path) {
        const urls = watched.get(path);
        if (urls)
            for (const url of urls) {
                reload(url, path);
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
        const resource = await cache.get(url);
        if (resource) {
            const stats = await fs_1.promises.stat(resource.filename);
            resource.content = await fs_1.promises.readFile(resource.filename);
            resource.headers["content-type"] = mime_types_1.contentType(resource.filename);
            resource.headers["content-length"] = stats.size;
            resource.headers["last-modified"] = stats.mtime.toUTCString();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUUxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdEQUF3QjtBQUN4QixnRUFBbUM7QUFDbkMsd0VBQW1DO0FBRW5DLDhDQUFzRDtBQUN0RCxrREFBMkQ7QUFDM0QsbURBQWtFO0FBQ2xFLHVDQUFxQztBQUNyQyxxQ0FBbUM7QUFnQnRCLFFBQUEsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUUxQzs7R0FFRztBQUVVLFFBQUEsbUJBQW1CLEdBQUcsc0JBQU8sQ0FBQyxVQUFVLE9BQXNCLEVBQUUsT0FBa0I7SUFFM0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7SUFDOUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7SUFDL0MsTUFBTSxHQUFHLEdBQUcsb0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0MsU0FBUyxLQUFLLENBQUMsR0FBVyxFQUFFLFFBQWtCO1FBRTFDLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtZQUNmLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTtnQkFDaEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsS0FBSztvQkFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzdEO1NBQ0o7UUFFRCxJQUFJ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QyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XG5pbXBvcnQge0ZTV2F0Y2hlcn0gZnJvbSBcImNob2tpZGFyXCI7XG5pbXBvcnQgZXRhZyBmcm9tIFwiZXRhZ1wiO1xuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XG5pbXBvcnQge091dGdvaW5nSHR0cEhlYWRlcnN9IGZyb20gXCJodHRwXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtFU05leHRPcHRpb25zfSBmcm9tIFwiLi4vY29uZmlndXJlXCI7XG5pbXBvcnQge3VzZUhvdE1vZHVsZVJlcGxhY2VtZW50fSBmcm9tIFwiLi4vaG1yLXNlcnZlclwiO1xuaW1wb3J0IHtTb3VyY2VNYXAsIHVzZVRyYW5zZm9ybWVyc30gZnJvbSBcIi4uL3RyYW5zZm9ybWVyc1wiO1xuaW1wb3J0IHtjb250ZW50VHlwZSwgSlNPTl9DT05URU5UX1RZUEV9IGZyb20gXCIuLi91dGlsL21pbWUtdHlwZXNcIjtcbmltcG9ydCB7dXNlWmxpYn0gZnJvbSBcIi4uL3V0aWwvemxpYlwiO1xuaW1wb3J0IHt1c2VSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xuXG5cbmV4cG9ydCB0eXBlIFF1ZXJ5ID0geyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XG5cbmV4cG9ydCB0eXBlIFJlc291cmNlID0ge1xuICAgIHBhdGhuYW1lOiBzdHJpbmdcbiAgICBxdWVyeTogUXVlcnlcbiAgICBmaWxlbmFtZTogc3RyaW5nXG4gICAgY29udGVudDogc3RyaW5nIHwgQnVmZmVyXG4gICAgaGVhZGVyczogT3V0Z29pbmdIdHRwSGVhZGVyc1xuICAgIGxpbmtzOiByZWFkb25seSBzdHJpbmdbXVxuICAgIHdhdGNoPzogSXRlcmFibGU8c3RyaW5nPlxuICAgIG9uY2hhbmdlPzogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgY29uc3QgTk9fTElOS1MgPSBPYmplY3QuZnJlZXplKFtdKTtcbmV4cG9ydCBjb25zdCBOT19RVUVSWSA9IE9iamVjdC5mcmVlemUoe30pO1xuXG4vKlxuICogTk9URTogY2FjaGUgJiBobXIgaGF2ZSB0d28gdmVyeSBkaXN0aW5jdCByb2xlcywgY2FjaGUgd29uJ3QgaW52YWxpZGF0ZSBhbiBlbnRyeSBiZWNhdXNlIHRoZSBkZXBlbmRlbnRzXG4gKi9cblxuZXhwb3J0IGNvbnN0IHVzZVJlc291cmNlUHJvdmlkZXIgPSBtZW1vaXplKGZ1bmN0aW9uIChvcHRpb25zOiBFU05leHRPcHRpb25zLCB3YXRjaGVyOiBGU1dhdGNoZXIpIHtcblxuICAgIGNvbnN0IGNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFJlc291cmNlIHwgUHJvbWlzZTxSZXNvdXJjZT4+KCk7XG4gICAgY29uc3Qgd2F0Y2hlZCA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKTtcbiAgICBjb25zdCBobXIgPSB1c2VIb3RNb2R1bGVSZXBsYWNlbWVudChvcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIHN0b3JlKHVybDogc3RyaW5nLCByZXNvdXJjZTogUmVzb3VyY2UpIHtcblxuICAgICAgICBpZiAob3B0aW9ucy5jYWNoZSkge1xuICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xuICAgICAgICAgICAgd2F0Y2gocmVzb3VyY2UuZmlsZW5hbWUsIHVybCk7XG4gICAgICAgICAgICBpZiAocmVzb3VyY2Uud2F0Y2gpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdhdGNoZWQgb2YgcmVzb3VyY2Uud2F0Y2gpIHdhdGNoKHdhdGNoZWQsIHVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaG1yLmVuZ2luZSAmJiByZXNvdXJjZS5saW5rcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBsaW5rIG9mIHJlc291cmNlLmxpbmtzKSB7XG4gICAgICAgICAgICAgICAgaG1yLmVuZ2luZS5hZGRSZWxhdGlvbnNoaXAodXJsLCBsaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc2NhcmQodXJsOiBzdHJpbmcsIHJlc291cmNlOiBSZXNvdXJjZSkge1xuICAgICAgICBpZiAoY2FjaGUpIHtcbiAgICAgICAgICAgIGNhY2hlLmRlbGV0ZSh1cmwpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChobXIuZW5naW5lICYmIHJlc291cmNlLmxpbmtzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgcmVzb3VyY2UubGlua3MpIHtcbiAgICAgICAgICAgICAgICBobXIuZW5naW5lLnJlbW92ZVJlbGF0aW9uc2hpcCh1cmwsIGxpbmspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2F0Y2goZmlsZW5hbWUsIHVybCk6IFNldDxzdHJpbmc+IHtcbiAgICAgICAgY29uc3QgcGF0aG5hbWUgPSBwYXRoLnJlbGF0aXZlKG9wdGlvbnMucm9vdERpciwgZmlsZW5hbWUpO1xuICAgICAgICBsZXQgdXJscyA9IHdhdGNoZWQuZ2V0KHBhdGhuYW1lKTtcbiAgICAgICAgaWYgKHVybHMpIHtcbiAgICAgICAgICAgIHVybHMuYWRkKHVybCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cmxzID0gbmV3IFNldDxzdHJpbmc+KCkuYWRkKHVybCk7XG4gICAgICAgICAgICB3YXRjaGVkLnNldChwYXRobmFtZSwgdXJscyk7XG4gICAgICAgICAgICB3YXRjaGVyLmFkZChwYXRobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW53YXRjaChwYXRoKSB7XG4gICAgICAgIHdhdGNoZWQuZGVsZXRlKHBhdGgpO1xuICAgICAgICB3YXRjaGVyLnVud2F0Y2gocGF0aCk7XG4gICAgfVxuXG4gICAgd2F0Y2hlci5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICBjb25zdCB1cmxzID0gd2F0Y2hlZC5nZXQocGF0aCk7XG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XG4gICAgICAgICAgICByZWxvYWQodXJsLCBwYXRoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgd2F0Y2hlci5vbihcInVubGlua1wiLCBmdW5jdGlvbiAoZXZlbnQsIHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJscyA9IHdhdGNoZWQuZ2V0KHBhdGgpO1xuICAgICAgICBpZiAodXJscykgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwiaW52YWxpZGF0ZVwiLCBwYXRoLCBcImZsdXNoXCIsIHVybCk7XG4gICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcbiAgICAgICAgfVxuICAgICAgICB1bndhdGNoKHBhdGgpO1xuICAgIH0pO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gcmVsb2FkKHVybDpzdHJpbmcsIHBhdGg6c3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgY2FjaGUuZ2V0KHVybCk7XG4gICAgICAgIGlmIChyZXNvdXJjZSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KHJlc291cmNlLmZpbGVuYW1lKTtcbiAgICAgICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShyZXNvdXJjZS5maWxlbmFtZSk7XG4gICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gY29udGVudFR5cGUocmVzb3VyY2UuZmlsZW5hbWUpO1xuICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdID0gc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZy53YXJuKFwibm8gY2FjaGUgZW50cnkgZm9yOlwiLCB1cmwpO1xuICAgICAgICAgICAgdW53YXRjaChwYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHtyb3V0ZX0gPSB1c2VSb3V0ZXIob3B0aW9ucyk7XG4gICAgY29uc3Qge3Nob3VsZFRyYW5zZm9ybSwgdHJhbnNmb3JtQ29udGVudH0gPSB1c2VUcmFuc2Zvcm1lcnMob3B0aW9ucyk7XG4gICAgY29uc3Qge2FwcGx5Q29tcHJlc3Npb259ID0gdXNlWmxpYihvcHRpb25zKTtcblxuICAgIC8qKlxuICAgICAqICAgICAgICAgIF8gICAgICAgICAgICBfIF9cbiAgICAgKiAgICAgICAgIChfKSAgICAgICAgICB8IChfKVxuICAgICAqICAgIF8gX18gIF8gXyBfXyAgIF9fX3wgfF8gXyBfXyAgIF9fX1xuICAgICAqICAgfCAnXyBcXHwgfCAnXyBcXCAvIF8gXFwgfCB8ICdfIFxcIC8gXyBcXFxuICAgICAqICAgfCB8XykgfCB8IHxfKSB8ICBfXy8gfCB8IHwgfCB8ICBfXy9cbiAgICAgKiAgIHwgLl9fL3xffCAuX18vIFxcX19ffF98X3xffCB8X3xcXF9fX3xcbiAgICAgKiAgIHwgfCAgICAgfCB8XG4gICAgICogICB8X3wgICAgIHxffFxuICAgICAqXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqL1xuICAgIGFzeW5jIGZ1bmN0aW9uIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcbiAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhd2FpdCByb3V0ZSh1cmwpO1xuICAgICAgICBpZiAoc2hvdWxkVHJhbnNmb3JtKHJlc291cmNlKSkge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlTWFwID0gYXdhaXQgdHJhbnNmb3JtQ29udGVudChyZXNvdXJjZSk7XG4gICAgICAgICAgICBpZiAoc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgc3RvcmVTb3VyY2VNYXAocmVzb3VyY2UuZmlsZW5hbWUsIHJlc291cmNlLnBhdGhuYW1lLCByZXNvdXJjZS5xdWVyeSwgc291cmNlTWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBldGFnSGVhZGVyKHJlc291cmNlKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzQ29udGVudChyZXNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3JlU291cmNlTWFwKGZpbGVuYW1lOiBzdHJpbmcsIHBhdGhuYW1lOiBzdHJpbmcsIHF1ZXJ5OiBRdWVyeSwgbWFwPzogU291cmNlTWFwIHwgbnVsbCkge1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhcHBseUNvbXByZXNzaW9uKEpTT04uc3RyaW5naWZ5KG1hcCksIFwiZGVmbGF0ZVwiKTtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gcGF0aG5hbWUgKyBcIi5tYXBcIjtcbiAgICAgICAgY29uc3Qgc291cmNlTWFwRmlsZW5hbWUgPSBmaWxlbmFtZSArIFwiLm1hcFwiO1xuXG4gICAgICAgIGNhY2hlLnNldChzb3VyY2VNYXBVcmwsIHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzb3VyY2VNYXBGaWxlbmFtZSxcbiAgICAgICAgICAgIHBhdGhuYW1lOiBzb3VyY2VNYXBVcmwsXG4gICAgICAgICAgICBxdWVyeTogcXVlcnksXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpTT05fQ09OVEVOVF9UWVBFLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogY29udGVudC5sZW5ndGgsIC8vIEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBcImRlZmxhdGVcIixcbiAgICAgICAgICAgICAgICBcImxhc3QtbW9kaWZpZWRcIjogbmV3IERhdGUoKS50b1VUQ1N0cmluZygpLFxuICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLWNhY2hlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaW5rczogTk9fTElOS1NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gZXRhZ0hlYWRlcih7aGVhZGVycywgcGF0aG5hbWV9OiBSZXNvdXJjZSkge1xuICAgICAgICBoZWFkZXJzW1wiZXRhZ1wiXSA9IGV0YWcoYCR7cGF0aG5hbWV9ICR7aGVhZGVyc1tcImNvbnRlbnQtbGVuZ3RoXCJdfSAke2hlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdfWAsIG9wdGlvbnMuZXRhZyk7XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gY29tcHJlc3NDb250ZW50KHJlc291cmNlOiBSZXNvdXJjZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24ocmVzb3VyY2UuY29udGVudCk7XG4gICAgICAgICAgICByZXNvdXJjZS5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIC4uLihyZXNvdXJjZS5oZWFkZXJzKSxcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHJlc291cmNlLmNvbnRlbnQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC1lbmNvZGluZ1wiOiBvcHRpb25zLmVuY29kaW5nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy5lcnJvcihgZmFpbGVkIHRvIGRlZmxhdGUgcmVzb3VyY2U6ICR7cmVzb3VyY2UuZmlsZW5hbWV9YCwgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFzeW5jIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGNhY2hlLmdldCh1cmwpO1xuICAgICAgICAgICAgaWYgKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwicmV0cmlldmVkIGZyb20gY2FjaGU6XCIsIGNoYWxrLm1hZ2VudGEodXJsKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc291cmNlID0gcHJvdmlkZVJlc291cmNlKHVybCkudGhlbihyZXNvdXJjZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlKHVybCwgcmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCByZXNvdXJjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5cbiJdfQ==