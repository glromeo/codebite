import chalk from "chalk";
import {FSWatcher} from "chokidar";
import etag from "etag";
import {promises as fs} from "fs";
import {OutgoingHttpHeaders} from "http";
import path from "path";
import memoize from "pico-memoize";
import log from "tiny-node-logger";
import {ESNextOptions} from "../configure";
import {useHotModuleReplacement} from "../hmr-server";
import {SourceMap, useTransformers} from "../transformers";
import {contentType, JSON_CONTENT_TYPE} from "../util/mime-types";
import {useZlib} from "../util/zlib";
import {useRouter} from "./router";


export type Query = { [name: string]: string };

export type Resource = {
    pathname: string
    query: Query
    filename: string
    content: string | Buffer
    headers: OutgoingHttpHeaders
    links: readonly string[]
    watch?: Iterable<string>
    onchange?: () => void
}

export const NO_LINKS = Object.freeze([]);
export const NO_QUERY = Object.freeze({});

/*
 * NOTE: cache & hmr have two very distinct roles, cache won't invalidate an entry because the dependents
 */

export const useResourceProvider = memoize(function (options: ESNextOptions, watcher: FSWatcher) {

    const cache = new Map<string, Resource | Promise<Resource>>();
    const watched = new Map<string, Set<string>>();
    const hmr = useHotModuleReplacement(options);

    function store(url: string, resource: Resource) {

        if (options.cache) {
            cache.set(url, resource);
            watch(resource.filename, url);
            if (resource.watch) {
                for (const watched of resource.watch) watch(watched, url);
            }
        }

        if (hmr.engine && resource.links) {
            for (const link of resource.links) {
                hmr.engine.addRelationship(url, link);
            }
        }
    }

    function discard(url: string, resource: Resource) {
        if (cache) {
            cache.delete(url);
        }
        if (hmr.engine && resource.links) {
            for (const link of resource.links) {
                hmr.engine.removeRelationship(url, link);
            }
        }
    }

    function watch(filename, url): Set<string> {
        const pathname = path.relative(options.rootDir, filename);
        let urls = watched.get(pathname);
        if (urls) {
            urls.add(url);
        } else {
            urls = new Set<string>().add(url);
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
        if (urls) for (const url of urls) {
            reload(url, path);
        }
    });

    watcher.on("unlink", function (event, path) {
        const urls = watched.get(path);
        if (urls) for (const url of urls) {
            log.debug("invalidate", path, "flush", url);
            cache.delete(url);
        }
        unwatch(path);
    });

    async function reload(url:string, path:string) {
        const resource = await cache.get(url);
        if (resource) {
            const stats = await fs.stat(resource.filename);
            resource.content = await fs.readFile(resource.filename);
            resource.headers["content-type"] = contentType(resource.filename);
            resource.headers["content-length"] = stats.size;
            resource.headers["last-modified"] = stats.mtime.toUTCString();
        } else {
            log.warn("no cache entry for:", url);
            unwatch(path);
        }
    }

    const {route} = useRouter(options);
    const {shouldTransform, transformContent} = useTransformers(options);
    const {applyCompression} = useZlib(options);

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
    async function provideResource(url: string): Promise<Resource> {
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

    function storeSourceMap(filename: string, pathname: string, query: Query, map?: SourceMap | null) {

        const content = applyCompression(JSON.stringify(map), "deflate");
        const sourceMapUrl = pathname + ".map";
        const sourceMapFilename = filename + ".map";

        cache.set(sourceMapUrl, {
            filename: sourceMapFilename,
            pathname: sourceMapUrl,
            query: query,
            content: content,
            headers: {
                "content-type": JSON_CONTENT_TYPE,
                "content-length": content.length, // Buffer.byteLength(content),
                "content-encoding": "deflate",
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            },
            links: NO_LINKS
        });
    }

    async function etagHeader({headers, pathname}: Resource) {
        headers["etag"] = etag(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
    }

    async function compressContent(resource: Resource) {
        try {
            resource.content = applyCompression(resource.content);
            resource.headers = {
                ...(resource.headers),
                "content-length": resource.content.length,
                "content-encoding": options.encoding
            };
        } catch (err) {
            log.error(`failed to deflate resource: ${resource.filename}`, err);
        }
    }

    return {
        async provideResource(url: string): Promise<Resource> {
            let resource = cache.get(url);
            if (resource) {
                log.debug("retrieved from cache:", chalk.magenta(url));
            } else {
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

