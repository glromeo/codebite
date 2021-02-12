"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fast_url_parser_1 = require("fast-url-parser");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const picomatch_1 = __importDefault(require("picomatch"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const babel_transformer_1 = require("../transformers/babel-transformer");
const esbuild_transformer_1 = require("../transformers/esbuild-transformer");
const html_transformer_1 = require("../transformers/html-transformer");
const sass_transformer_1 = require("../transformers/sass-transformer");
const resource_cache_1 = require("../util/resource-cache");
const workspace_files_1 = require("./workspace-files");
const { HTML_CONTENT_TYPE, SASS_CONTENT_TYPE, SCSS_CONTENT_TYPE, CSS_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE, TYPESCRIPT_CONTENT_TYPE } = require("../util/mime-types");
exports.useResourceProvider = nano_memoize_1.default(function (options, watcher) {
    const cache = options.cache && new resource_cache_1.ResourceCache(options, watcher);
    const { readWorkspaceFile } = workspace_files_1.useWorkspaceFiles(options);
    const { htmlTransformer } = html_transformer_1.useHtmlTransformer(options);
    const { esbuildTransformer } = esbuild_transformer_1.useEsBuildTransformer(options);
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(options);
    const { sassTransformer } = sass_transformer_1.useSassTransformer(options);
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
                    task = options.babel ? babelTransformer(filename, content) : esbuildTransformer(filename, content);
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
    const include = options.transform && options.transform.include && picomatch_1.default(options.transform.include);
    const exclude = options.transform && options.transform.exclude && picomatch_1.default(options.transform.exclude);
    /**
     *
     * @param url
     * @param accept
     * @param userAgent
     * @returns {Promise<{headers: *, filename: *, watch: *, query: ({type}|*), links: *, content: *, pathname: any}|V>}
     */
    async function provideResource(url, { "accept": accept, "user-agent": userAgent }) {
        let { pathname, query } = fast_url_parser_1.parse(url, true);
        if (pathname.endsWith(".scss.js") || pathname.endsWith(".sass.js") || pathname.endsWith(".css.js")) {
            pathname = pathname.slice(0, -3);
            query.type = "module";
        }
        let { filename, content, headers } = await readWorkspaceFile(pathname);
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
        headers["etag"] = etag_1.default(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
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
        provideResource(url, headers) {
            let resource;
            if (cache) {
                resource = cache.get(url);
                if (resource !== undefined) {
                    tiny_node_logger_1.default.debug("retrieved from cache:", chalk_1.default.magenta(url));
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
//# sourceMappingURL=resource-provider.js.map