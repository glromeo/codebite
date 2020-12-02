const log = require("tiny-node-logger");
const chalk = require("chalk");
const picomatch = require("picomatch");
const etag = require("etag");
const {memoize} = require("esnext-server-extras");
const {parse: parseURL} = require("fast-url-parser");
const {relative, resolve} = require("path");
const {toPosix} = require("esnext-server-extras");
const {useBabelTransformer} = require("../transformers/babel-transformer.js");
const {useHtmlTransformer} = require("../transformers/html-transformer.js");
const {ResourceCache} = require("./resource-cache.js");
const {useSassTransformer} = require("../transformers/sass-transformer.js");
const {useWorkspaceFiles} = require("./workspace-files.js");

const {
    HTML_CONTENT_TYPE,
    SASS_CONTENT_TYPE,
    SCSS_CONTENT_TYPE,
    CSS_CONTENT_TYPE,
    JAVASCRIPT_CONTENT_TYPE,
    TYPESCRIPT_CONTENT_TYPE
} = require("esnext-server-extras");

module.exports.useResourceProvider = memoize(function (config, watcher) {

    const cache = config.cache && new ResourceCache(config, watcher);

    const {readWorkspaceFile} = useWorkspaceFiles(config);
    const {htmlTransformer} = useHtmlTransformer(config);
    const {babelTransformer} = useBabelTransformer(config, true);
    const {sassTransformer} = useSassTransformer(config);

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
                    task = babelTransformer(filename, content);
                    break;
            }
            if (task !== undefined) {
                task = task.catch(error => {
                    error.message = `unable to transform: ${filename}\n${error.message}`;
                    throw error;
                }).finally(out => {
                    pendingTasks.delete(key);
                    return out;
                });
                pendingTasks.set(key, task);
            }
        }
        return task;
    }

    const include = config.transform && config.transform.include && picomatch(config.transform.include);
    const exclude = config.transform && config.transform.exclude && picomatch(config.transform.exclude);

    /**
     *
     * @param url
     * @param accept
     * @param userAgent
     * @returns {Promise<{headers: *, filename: *, watch: *, query: ({type}|*), links: *, content: *, pathname: any}|V>}
     */
    async function provideResource(url, {"accept": accept, "user-agent": userAgent}) {

        if (cache) {
            const cached = cache.get(url);
            if (cached !== undefined) {
                log.debug("retrieved from cache:", chalk.magenta(url));
                return cached;
            }
        }

        const {
            pathname,
            query
        } = parseURL(url, true);

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

        headers["etag"] = etag(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, config.etag);

        const resource = {
            pathname,
            query,
            filename,
            content,
            headers,
            links,
            watch
        };

        if (cache) {
            cache.set(url, resource);
        }

        return resource;
    }

    return {
        provideResource
    };
});

