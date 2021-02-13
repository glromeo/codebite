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
const fast_zlib_1 = __importDefault(require("fast-zlib"));
const { HTML_CONTENT_TYPE, SASS_CONTENT_TYPE, SCSS_CONTENT_TYPE, CSS_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE, TYPESCRIPT_CONTENT_TYPE } = require("../util/mime-types");
exports.useResourceProvider = nano_memoize_1.default(function (options, watcher) {
    const cache = options.cache && new resource_cache_1.ResourceCache(options, watcher);
    const { readWorkspaceFile } = workspace_files_1.useWorkspaceFiles(options);
    const { htmlTransformer } = html_transformer_1.useHtmlTransformer(options);
    const { esbuildTransformer } = esbuild_transformer_1.useEsBuildTransformer(options);
    const { babelTransformer } = babel_transformer_1.useBabelTransformer(options);
    const { sassTransformer } = sass_transformer_1.useSassTransformer(options);
    function useComplession(encoding) {
        switch (encoding) {
            case "br":
                return new fast_zlib_1.default.BrotliCompress();
            case "gzip":
                return new fast_zlib_1.default.Gzip();
            case "deflate":
            default:
                return new fast_zlib_1.default.Deflate();
        }
    }
    function formatHrtime(hrtime) {
        return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    }
    function transformResource(contentType, filename, content, query) {
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
        let { filename, content, headers, links, watch } = await readWorkspaceFile(pathname);
        let transform = headers["x-transformer"] !== "none" && headers["cache-control"] === "no-cache" || query.type;
        if (transform && include) {
            transform = include(pathname);
        }
        if (transform && exclude) {
            transform = !exclude(pathname);
        }
        if (transform)
            try {
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
            catch (error) {
                error.message = `unable to transform: ${filename}\n${error.message}`;
                throw error;
            }
        headers["etag"] = etag_1.default(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
        if (options.encoding)
            try {
                const deflate = useComplession(options.encoding);
                const deflated = deflate.process(content);
                content = deflated;
                headers = {
                    ...headers,
                    "content-length": deflated.length,
                    "content-encoding": options.encoding
                };
            }
            catch (err) {
                tiny_node_logger_1.default.error(`failed to deflate resource: ${filename}`, err);
            }
        return {
            pathname,
            query,
            filename,
            content,
            headers,
            links,
            watch
        };
    }
    const pending = new Map();
    return {
        async provideResource(url, headers) {
            if (cache && cache.has(url)) {
                tiny_node_logger_1.default.debug("retrieved from cache:", chalk_1.default.magenta(url));
                return cache.get(url);
            }
            if (pending.has(url)) {
                return pending.get(url);
            }
            else
                try {
                    const resource = await provideResource(url, headers);
                    if (cache) {
                        cache.set(url, resource);
                    }
                    return resource;
                }
                finally {
                    pending.delete(url);
                }
        }
    };
});
//# sourceMappingURL=resource-provider.js.map