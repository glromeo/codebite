import chalk from "chalk";
import {FSWatcher} from "chokidar";
import etag from "etag";
import {parse as parseURL} from "fast-url-parser";
import zlib from "fast-zlib";
import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";
import path from "path";
import memoize from "pico-memoize";
import picomatch from "picomatch";
import log from "tiny-node-logger";
import {ESNextOptions} from "../configure";
import {useHotModuleReplacement} from "../hmr-server";
import {useBabelTransformer} from "../transformers/babel-transformer";
import {useEsBuildTransformer} from "../transformers/esbuild-transformer";
import {useHtmlTransformer} from "../transformers/html-transformer";
import {useSassTransformer} from "../transformers/sass-transformer";
import {JSON_CONTENT_TYPE} from "../util/mime-types";
import {useWorkspaceFiles} from "./workspace-files";

const {
    HTML_CONTENT_TYPE,
    SASS_CONTENT_TYPE,
    SCSS_CONTENT_TYPE,
    CSS_CONTENT_TYPE,
    JAVASCRIPT_CONTENT_TYPE,
    TYPESCRIPT_CONTENT_TYPE
} = require("../util/mime-types");

export type Resource = {
    pathname: string
    query: string
    filename: string
    content: string | Buffer
    headers: OutgoingHttpHeaders
    links?: Iterable<string>
    watch?: Iterable<string>
}

/*
 * NOTE: cache & hmr have two very distinct roles, cache won't invalidate an entry because the dependents
 */

export const useResourceProvider = memoize(function (options: ESNextOptions, watcher: FSWatcher) {

    const cache = new Map<string, Resource>();
    const watched = new Map<string, string | string[]>();
    const pending = new Map<string, Promise<Resource>>();
    const hmr = useHotModuleReplacement(options);

    function watch(path, url) {
        const urls = watched.get(path);
        if (urls) {
            if (typeof urls === "string") {
                if (urls === url) return;
                else watched.set(path, [urls, url]);
            } else {
                if (urls.includes(url)) return;
                else urls.push(url);
            }
        } else {
            watched.set(path, url);
            watcher.add(path);
        }
    }

    function invalidate(path) {
        const urls = watched.get(path);
        if (urls) {
            if (typeof urls === "string") {
                cache.delete(urls);
                log.debug("invalidate", path, "flush", urls);
            } else for (const url of urls) {
                cache.delete(url);
                log.debug("invalidate", path, "flush", url);
            }
        } else {
            log.info("invalidate", path, "had no side effects");
        }
    }

    function unwatch(path) {
        watched.delete(path);
        watcher.unwatch(path);
    }

    watcher.on("change", (path) => {
        invalidate(path);
    });

    watcher.on("unlink", (event, path) => {
        unwatch(path);
        invalidate(path);
    });

    const {readWorkspaceFile} = useWorkspaceFiles(options);
    const {htmlTransformer} = useHtmlTransformer(options);
    const {esbuildTransformer} = useEsBuildTransformer(options);
    const {babelTransformer} = useBabelTransformer(options);
    const {sassTransformer} = useSassTransformer(options);

    function formatHrtime(hrtime) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }

    function transformResource(contentType, filename: string, content: string | Buffer, query: { type: string }) {
        if (content instanceof Buffer) {
            content = content.toString("utf-8");
        }
        switch (contentType) {
            case HTML_CONTENT_TYPE:
                return htmlTransformer(filename, content);
            case CSS_CONTENT_TYPE:
            case SASS_CONTENT_TYPE:
            case SCSS_CONTENT_TYPE:
                return sassTransformer(filename, content, query.type);
            case JAVASCRIPT_CONTENT_TYPE:
            case TYPESCRIPT_CONTENT_TYPE:
                return options.babel ? babelTransformer(filename, content) : esbuildTransformer(filename, content);
        }
    }

    const include = options.transform && options.transform.include && picomatch(options.transform.include);
    const exclude = options.transform && options.transform.exclude && picomatch(options.transform.exclude);

    function compress(content: string | Buffer, encoding = options.encoding) {
        let compress = useCompression(encoding);
        try {
            return compress.process(content);
        } finally {
            compress.close();
        }
    }

    function useCompression(encoding?:string) {
        switch (encoding) {
            case "br":
                return new zlib.BrotliCompress();
            case "gzip":
                return new zlib.Gzip();
            case "deflate":
            default:
                return new zlib.Deflate();
        }
    }


    /**
     *
     * @param url
     * @param accept
     * @param userAgent
     * @returns {Promise<{headers: *, filename: *, watch: *, query: ({type}|*), links: *, content: *, pathname: any}|V>}
     */
    async function provideResource(url: string, {"accept": accept, "user-agent": userAgent}: IncomingHttpHeaders) {

        let {
            pathname,
            query
        } = parseURL(url, true);

        if (pathname.endsWith(".scss.js") || pathname.endsWith(".sass.js") || pathname.endsWith(".css.js")) {
            pathname = pathname.slice(0, -3);
            query.type = "module";
        }

        let {
            filename,
            content,
            headers,
            links,
            watch
        } = await readWorkspaceFile(pathname);

        let transform = headers["x-transformer"] !== "none" && headers["cache-control"] === "no-cache" || query.type;
        if (transform && include) {
            transform = include(pathname);
        }
        if (transform && exclude) {
            transform = !exclude(pathname);
        }

        if (transform) try {
            const hrtime = process.hrtime();
            const transformed = await transformResource(headers["content-type"], filename, content, query);
            if (transformed) {
                if (transformed.map) {
                    const content = compress(JSON.stringify(transformed.map), "deflate");
                    const sourceMapUrl = pathname + ".map";
                    cache.set(sourceMapUrl, {
                        filename: sourceMapUrl,
                        pathname,
                        query: "",
                        content: content,
                        headers: {
                            "content-type": JSON_CONTENT_TYPE,
                            "content-length": content.length, // Buffer.byteLength(content),
                            "content-encoding": "deflate",
                            "last-modified": new Date().toUTCString(),
                            "cache-control": "no-cache"
                        }
                    });
                }
                content = transformed.content;
                headers["content-type"] = transformed.headers["content-type"];
                headers["content-length"] = transformed.headers["content-length"];
                headers["x-transformer"] = transformed.headers["x-transformer"];
                headers["x-transform-duration"] = `${formatHrtime(process.hrtime(hrtime))}sec`;
                links = transformed.links;
                watch = transformed.watch;
            }
        } catch (error) {
            error.message = `unable to transform: ${filename}\n${error.message}`;
            throw error;
        }

        headers["etag"] = etag(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);

        if (options.encoding) try {
            content = compress(content);
            headers = {
                ...headers,
                "content-length": content.length,
                "content-encoding": options.encoding
            };
        } catch (err) {
            log.error(`failed to deflate resource: ${filename}`, err);
        }

        return {
            pathname,
            query,
            filename,
            content,
            headers,
            links,
            watch
        } as Resource;
    }

    return {
        async provideResource(url: string, headers: IncomingHttpHeaders): Promise<Resource> {
            if (options.cache && cache.has(url)) {
                log.debug("retrieved from cache:", chalk.magenta(url));
                return cache.get(url)!;
            }
            if (pending.has(url)) {
                return pending.get(url)!;
            } else try {
                const resource = await provideResource(url, headers);
                if (cache) {
                    cache.set(url, resource);
                    watch(path.relative(options.rootDir, resource.filename), url);
                    if (resource.watch) {
                        for (const watched of resource.watch) {
                            watch(path.relative(options.rootDir, watched), url);
                        }
                    }
                }
                return resource;
            } finally {
                pending.delete(url);
            }
        }
    };
});

