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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUUxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdEQUF3QjtBQUN4QixnRUFBbUM7QUFDbkMsd0VBQW1DO0FBRW5DLDhDQUFzRDtBQUN0RCxrREFBMkQ7QUFDM0QsbURBQWtFO0FBQ2xFLHVDQUFxQztBQUNyQyxxQ0FBbUM7QUFnQnRCLFFBQUEsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUUxQzs7R0FFRztBQUVVLFFBQUEsbUJBQW1CLEdBQUcsc0JBQU8sQ0FBQyxVQUFVLE9BQXNCLEVBQUUsT0FBa0I7SUFFM0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7SUFDOUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7SUFDL0MsTUFBTSxHQUFHLEdBQUcsb0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0MsU0FBUyxLQUFLLENBQUMsR0FBVyxFQUFFLFFBQWtCO1FBRTFDLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtZQUNmLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTtnQkFDaEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsS0FBSztvQkFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzdEO1NBQ0o7UUFFRCxJQUFJ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QyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XHJcbmltcG9ydCB7RlNXYXRjaGVyfSBmcm9tIFwiY2hva2lkYXJcIjtcclxuaW1wb3J0IGV0YWcgZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7RVNOZXh0T3B0aW9uc30gZnJvbSBcIi4uL2NvbmZpZ3VyZVwiO1xyXG5pbXBvcnQge3VzZUhvdE1vZHVsZVJlcGxhY2VtZW50fSBmcm9tIFwiLi4vaG1yLXNlcnZlclwiO1xyXG5pbXBvcnQge1NvdXJjZU1hcCwgdXNlVHJhbnNmb3JtZXJzfSBmcm9tIFwiLi4vdHJhbnNmb3JtZXJzXCI7XHJcbmltcG9ydCB7Y29udGVudFR5cGUsIEpTT05fQ09OVEVOVF9UWVBFfSBmcm9tIFwiLi4vdXRpbC9taW1lLXR5cGVzXCI7XHJcbmltcG9ydCB7dXNlWmxpYn0gZnJvbSBcIi4uL3V0aWwvemxpYlwiO1xyXG5pbXBvcnQge3VzZVJvdXRlcn0gZnJvbSBcIi4vcm91dGVyXCI7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgUXVlcnkgPSB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbmV4cG9ydCB0eXBlIFJlc291cmNlID0ge1xyXG4gICAgcGF0aG5hbWU6IHN0cmluZ1xyXG4gICAgcXVlcnk6IFF1ZXJ5XHJcbiAgICBmaWxlbmFtZTogc3RyaW5nXHJcbiAgICBjb250ZW50OiBzdHJpbmcgfCBCdWZmZXJcclxuICAgIGhlYWRlcnM6IE91dGdvaW5nSHR0cEhlYWRlcnNcclxuICAgIGxpbmtzOiByZWFkb25seSBzdHJpbmdbXVxyXG4gICAgd2F0Y2g/OiBJdGVyYWJsZTxzdHJpbmc+XHJcbiAgICBvbmNoYW5nZT86ICgpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IE5PX0xJTktTID0gT2JqZWN0LmZyZWV6ZShbXSk7XHJcbmV4cG9ydCBjb25zdCBOT19RVUVSWSA9IE9iamVjdC5mcmVlemUoe30pO1xyXG5cclxuLypcclxuICogTk9URTogY2FjaGUgJiBobXIgaGF2ZSB0d28gdmVyeSBkaXN0aW5jdCByb2xlcywgY2FjaGUgd29uJ3QgaW52YWxpZGF0ZSBhbiBlbnRyeSBiZWNhdXNlIHRoZSBkZXBlbmRlbnRzXHJcbiAqL1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVJlc291cmNlUHJvdmlkZXIgPSBtZW1vaXplKGZ1bmN0aW9uIChvcHRpb25zOiBFU05leHRPcHRpb25zLCB3YXRjaGVyOiBGU1dhdGNoZXIpIHtcclxuXHJcbiAgICBjb25zdCBjYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBSZXNvdXJjZSB8IFByb21pc2U8UmVzb3VyY2U+PigpO1xyXG4gICAgY29uc3Qgd2F0Y2hlZCA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKTtcclxuICAgIGNvbnN0IGhtciA9IHVzZUhvdE1vZHVsZVJlcGxhY2VtZW50KG9wdGlvbnMpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHN0b3JlKHVybDogc3RyaW5nLCByZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2FjaGUpIHtcclxuICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICB3YXRjaChyZXNvdXJjZS5maWxlbmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc291cmNlLndhdGNoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdhdGNoZWQgb2YgcmVzb3VyY2Uud2F0Y2gpIHdhdGNoKHdhdGNoZWQsIHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChobXIuZW5naW5lICYmIHJlc291cmNlLmxpbmtzKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgbGluayBvZiByZXNvdXJjZS5saW5rcykge1xyXG4gICAgICAgICAgICAgICAgaG1yLmVuZ2luZS5hZGRSZWxhdGlvbnNoaXAodXJsLCBsaW5rKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkaXNjYXJkKHVybDogc3RyaW5nLCByZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuICAgICAgICBpZiAoY2FjaGUpIHtcclxuICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChobXIuZW5naW5lICYmIHJlc291cmNlLmxpbmtzKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgbGluayBvZiByZXNvdXJjZS5saW5rcykge1xyXG4gICAgICAgICAgICAgICAgaG1yLmVuZ2luZS5yZW1vdmVSZWxhdGlvbnNoaXAodXJsLCBsaW5rKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXRjaChmaWxlbmFtZSwgdXJsKTogU2V0PHN0cmluZz4ge1xyXG4gICAgICAgIGNvbnN0IHBhdGhuYW1lID0gcGF0aC5yZWxhdGl2ZShvcHRpb25zLnJvb3REaXIsIGZpbGVuYW1lKTtcclxuICAgICAgICBsZXQgdXJscyA9IHdhdGNoZWQuZ2V0KHBhdGhuYW1lKTtcclxuICAgICAgICBpZiAodXJscykge1xyXG4gICAgICAgICAgICB1cmxzLmFkZCh1cmwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybHMgPSBuZXcgU2V0PHN0cmluZz4oKS5hZGQodXJsKTtcclxuICAgICAgICAgICAgd2F0Y2hlZC5zZXQocGF0aG5hbWUsIHVybHMpO1xyXG4gICAgICAgICAgICB3YXRjaGVyLmFkZChwYXRobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1cmxzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVud2F0Y2gocGF0aCkge1xyXG4gICAgICAgIHdhdGNoZWQuZGVsZXRlKHBhdGgpO1xyXG4gICAgICAgIHdhdGNoZXIudW53YXRjaChwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICB3YXRjaGVyLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChwYXRoKSB7XHJcbiAgICAgICAgY29uc3QgdXJscyA9IHdhdGNoZWQuZ2V0KHBhdGgpO1xyXG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XHJcbiAgICAgICAgICAgIHJlbG9hZCh1cmwsIHBhdGgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHdhdGNoZXIub24oXCJ1bmxpbmtcIiwgZnVuY3Rpb24gKGV2ZW50LCBwYXRoKSB7XHJcbiAgICAgICAgY29uc3QgdXJscyA9IHdhdGNoZWQuZ2V0KHBhdGgpO1xyXG4gICAgICAgIGlmICh1cmxzKSBmb3IgKGNvbnN0IHVybCBvZiB1cmxzKSB7XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImludmFsaWRhdGVcIiwgcGF0aCwgXCJmbHVzaFwiLCB1cmwpO1xyXG4gICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdW53YXRjaChwYXRoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIHJlbG9hZCh1cmw6c3RyaW5nLCBwYXRoOnN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHJlc291cmNlID0gYXdhaXQgY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgaWYgKHJlc291cmNlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPSBjb250ZW50VHlwZShyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXSA9IHN0YXRzLnNpemU7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJsYXN0LW1vZGlmaWVkXCJdID0gc3RhdHMubXRpbWUudG9VVENTdHJpbmcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cud2FybihcIm5vIGNhY2hlIGVudHJ5IGZvcjpcIiwgdXJsKTtcclxuICAgICAgICAgICAgdW53YXRjaChwYXRoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qge3JvdXRlfSA9IHVzZVJvdXRlcihvcHRpb25zKTtcclxuICAgIGNvbnN0IHtzaG91bGRUcmFuc2Zvcm0sIHRyYW5zZm9ybUNvbnRlbnR9ID0gdXNlVHJhbnNmb3JtZXJzKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge2FwcGx5Q29tcHJlc3Npb259ID0gdXNlWmxpYihvcHRpb25zKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICAgICAgICAgIF8gICAgICAgICAgICBfIF9cclxuICAgICAqICAgICAgICAgKF8pICAgICAgICAgIHwgKF8pXHJcbiAgICAgKiAgICBfIF9fICBfIF8gX18gICBfX198IHxfIF8gX18gICBfX19cclxuICAgICAqICAgfCAnXyBcXHwgfCAnXyBcXCAvIF8gXFwgfCB8ICdfIFxcIC8gXyBcXFxyXG4gICAgICogICB8IHxfKSB8IHwgfF8pIHwgIF9fLyB8IHwgfCB8IHwgIF9fL1xyXG4gICAgICogICB8IC5fXy98X3wgLl9fLyBcXF9fX3xffF98X3wgfF98XFxfX198XHJcbiAgICAgKiAgIHwgfCAgICAgfCB8XHJcbiAgICAgKiAgIHxffCAgICAgfF98XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHVybFxyXG4gICAgICovXHJcbiAgICBhc3luYyBmdW5jdGlvbiBwcm92aWRlUmVzb3VyY2UodXJsOiBzdHJpbmcpOiBQcm9taXNlPFJlc291cmNlPiB7XHJcbiAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBhd2FpdCByb3V0ZSh1cmwpO1xyXG4gICAgICAgIGlmIChzaG91bGRUcmFuc2Zvcm0ocmVzb3VyY2UpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZU1hcCA9IGF3YWl0IHRyYW5zZm9ybUNvbnRlbnQocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlTWFwKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yZVNvdXJjZU1hcChyZXNvdXJjZS5maWxlbmFtZSwgcmVzb3VyY2UucGF0aG5hbWUsIHJlc291cmNlLnF1ZXJ5LCBzb3VyY2VNYXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IGV0YWdIZWFkZXIocmVzb3VyY2UpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNvbXByZXNzQ29udGVudChyZXNvdXJjZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVNvdXJjZU1hcChmaWxlbmFtZTogc3RyaW5nLCBwYXRobmFtZTogc3RyaW5nLCBxdWVyeTogUXVlcnksIG1hcD86IFNvdXJjZU1hcCB8IG51bGwpIHtcclxuXHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24oSlNPTi5zdHJpbmdpZnkobWFwKSwgXCJkZWZsYXRlXCIpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IHBhdGhuYW1lICsgXCIubWFwXCI7XHJcbiAgICAgICAgY29uc3Qgc291cmNlTWFwRmlsZW5hbWUgPSBmaWxlbmFtZSArIFwiLm1hcFwiO1xyXG5cclxuICAgICAgICBjYWNoZS5zZXQoc291cmNlTWFwVXJsLCB7XHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzb3VyY2VNYXBGaWxlbmFtZSxcclxuICAgICAgICAgICAgcGF0aG5hbWU6IHNvdXJjZU1hcFVybCxcclxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxyXG4gICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBKU09OX0NPTlRFTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogY29udGVudC5sZW5ndGgsIC8vIEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQpLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IFwiZGVmbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLWNhY2hlXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbGlua3M6IE5PX0xJTktTXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZXRhZ0hlYWRlcih7aGVhZGVycywgcGF0aG5hbWV9OiBSZXNvdXJjZSkge1xyXG4gICAgICAgIGhlYWRlcnNbXCJldGFnXCJdID0gZXRhZyhgJHtwYXRobmFtZX0gJHtoZWFkZXJzW1wiY29udGVudC1sZW5ndGhcIl19ICR7aGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl19YCwgb3B0aW9ucy5ldGFnKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBjb21wcmVzc0NvbnRlbnQocmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGFwcGx5Q29tcHJlc3Npb24ocmVzb3VyY2UuY29udGVudCk7XHJcbiAgICAgICAgICAgIHJlc291cmNlLmhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi4ocmVzb3VyY2UuaGVhZGVycyksXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IHJlc291cmNlLmNvbnRlbnQubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWVuY29kaW5nXCI6IG9wdGlvbnMuZW5jb2RpbmdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgbG9nLmVycm9yKGBmYWlsZWQgdG8gZGVmbGF0ZSByZXNvdXJjZTogJHtyZXNvdXJjZS5maWxlbmFtZX1gLCBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFzeW5jIHByb3ZpZGVSZXNvdXJjZSh1cmw6IHN0cmluZyk6IFByb21pc2U8UmVzb3VyY2U+IHtcclxuICAgICAgICAgICAgbGV0IHJlc291cmNlID0gY2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFwicmV0cmlldmVkIGZyb20gY2FjaGU6XCIsIGNoYWxrLm1hZ2VudGEodXJsKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSA9IHByb3ZpZGVSZXNvdXJjZSh1cmwpLnRoZW4ocmVzb3VyY2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlKHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnNldCh1cmwsIHJlc291cmNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcblxyXG4iXX0=