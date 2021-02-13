import chalk from "chalk";
import {FSWatcher} from "chokidar";
import etag from "etag";
import {parse as parseURL} from "fast-url-parser";
import {IncomingHttpHeaders} from "http";
import memoized from "nano-memoize";
import picomatch from "picomatch";
import log from "tiny-node-logger";
import {ESNextOptions} from "../configure";
import {useBabelTransformer} from "../transformers/babel-transformer";
import {useEsBuildTransformer} from "../transformers/esbuild-transformer";
import {useHtmlTransformer} from "../transformers/html-transformer";
import {useSassTransformer} from "../transformers/sass-transformer";
import {Resource, ResourceCache} from "../util/resource-cache";
import {useWorkspaceFiles} from "./workspace-files";
import zlib from "fast-zlib";

const {
    HTML_CONTENT_TYPE,
    SASS_CONTENT_TYPE,
    SCSS_CONTENT_TYPE,
    CSS_CONTENT_TYPE,
    JAVASCRIPT_CONTENT_TYPE,
    TYPESCRIPT_CONTENT_TYPE
} = require("../util/mime-types");

export const useResourceProvider = memoized(function (options: ESNextOptions, watcher: FSWatcher) {

    const cache = options.cache && new ResourceCache(options, watcher);

    const {readWorkspaceFile} = useWorkspaceFiles(options);
    const {htmlTransformer} = useHtmlTransformer(options);
    const {esbuildTransformer} = useEsBuildTransformer(options);
    const {babelTransformer} = useBabelTransformer(options);
    const {sassTransformer} = useSassTransformer(options);

    function useComplession(encoding) {
        switch (encoding) {
            case "br":
                return new zlib.BrotliCompress() as zlib.BrotliCompress;
            case "gzip":
                return new zlib.Gzip() as zlib.Gzip;
            case "deflate":
            default:
                return new zlib.Deflate() as zlib.Deflate;
        }
    }

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
                if (cache && transformed.map) {
                    cache.storeSourceMap(url, transformed.map);
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
            const deflate = useComplession(options.encoding);
            const deflated = deflate.process(content);
            content = deflated;
            headers = {
                ...headers,
                "content-length": deflated.length,
                "content-encoding": options.encoding
            }
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

    const pending = new Map<string, Promise<Resource>>();

    return {
        async provideResource(url: string, headers: IncomingHttpHeaders): Promise<Resource> {
            if (cache && cache.has(url)) {
                log.debug("retrieved from cache:", chalk.magenta(url));
                return cache.get(url)!;
            }
            if (pending.has(url)) {
                return pending.get(url)!;
            } else try {
                const resource = await provideResource(url, headers);
                if (cache) {
                    cache.set(url, resource);
                }
                return resource;
            } finally {
                pending.delete(url);
            }
        }
    };
});

