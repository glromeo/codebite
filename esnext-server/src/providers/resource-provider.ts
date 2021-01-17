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

    function formatHrtime(hrtime) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }

    const pendingTasks = new Map();

    function transformResource(contentType, filename, content, query) {
        const key = query.type !== undefined ? `${query.type}:${filename}` : filename;
        let task = pendingTasks.get(key);
        if (task === undefined) {
            switch (contentType) {
                case HTML_CONTENT_TYPE:
                    task = htmlTransformer(filename, content);
                    break;
                case CSS_CONTENT_TYPE:
                case SASS_CONTENT_TYPE:
                case SCSS_CONTENT_TYPE:
                    task = sassTransformer(filename, content, query.type);
                    break;
                case JAVASCRIPT_CONTENT_TYPE:
                case TYPESCRIPT_CONTENT_TYPE:
                    task = esbuildTransformer(filename, content) || babelTransformer(filename, content);
                    break;
            }
            if (task !== undefined) {
                task = task.catch(error => {
                    error.message = `unable to transform: ${filename}\n${error.message}`;
                    throw error;
                }).finally(() => {
                    pendingTasks.delete(key);
                });
                pendingTasks.set(key, task);
            }
        }
        return task;
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
            headers
        } = await readWorkspaceFile(pathname);

        let links, watch;

        let transform = headers["x-transformer"] !== "none" && headers["cache-control"] === "no-cache" || query.type;
        if (transform && include) {
            transform = include(pathname);
        }
        if (transform && exclude) {
            transform = !exclude(pathname);
        }

        if (transform) {
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
        }

        headers["etag"] = etag(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);

        const resource = {
            pathname,
            query,
            filename,
            content,
            headers,
            links,
            watch
        };

        return resource;
    }

    return {
        provideResource(url: string, headers: IncomingHttpHeaders): Promise<Resource> {
            let resource;
            if (cache) {
                resource = cache.get(url);
                if (resource !== undefined) {
                    log.debug("retrieved from cache:", chalk.magenta(url));
                    return resource;
                }
            }
            resource = provideResource(url, headers);
            if (cache) {
                cache.set(url, resource);
            }
            return resource;
        }
    };
});

