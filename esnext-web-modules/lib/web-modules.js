"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebModules = exports.defaultOptions = void 0;
const chalk_1 = __importDefault(require("chalk"));
const esbuild_1 = __importDefault(require("esbuild"));
const esbuild_sass_plugin_1 = require("esbuild-sass-plugin");
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importStar(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const cjs_entry_proxy_1 = require("./cjs-entry-proxy");
const entry_modules_1 = require("./entry-modules");
const es_import_utils_1 = require("./es-import-utils");
const esm_entry_proxy_1 = require("./esm-entry-proxy");
const notifications_1 = require("./notifications");
const replace_require_1 = require("./replace-require");
const utility_1 = require("./utility");
const workspaces_1 = require("./workspaces");
function defaultOptions() {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}
exports.defaultOptions = defaultOptions;
exports.useWebModules = (0, nano_memoize_1.default)((options = defaultOptions()) => {
    if (!options.environment)
        options.environment = "development";
    if (!options.resolve)
        options.resolve = {};
    if (!options.resolve.extensions)
        options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external)
        options.external = ["@babel/runtime/**"];
    if (!options.esbuild)
        options.esbuild = {};
    const notify = (0, notifications_1.useNotifications)(options);
    options.esbuild = {
        define: {
            "process.env.NODE_ENV": `"${options.environment}"`,
            ...options.esbuild.define
        },
        sourcemap: true,
        target: ["chrome80"],
        ...options.esbuild,
        format: "esm",
        bundle: true
    };
    const ALREADY_RESOLVED = Promise.resolve();
    const resolveOptions = {
        basedir: options.rootDir,
        includeCoreModules: false,
        packageFilter(pkg, pkgfile) {
            return { main: pkg.module || pkg["jsnext:main"] || pkg.main };
        },
        ...options.resolve
    };
    const outDir = path_1.default.join(options.rootDir, "web_modules");
    if (options.clean && (0, fs_1.existsSync)(outDir)) {
        (0, fs_1.rmdirSync)(outDir, { recursive: true });
        tiny_node_logger_1.default.warn("cleaned web_modules directory");
    }
    (0, fs_1.mkdirSync)(outDir, { recursive: true });
    const importMap = {
        imports: {
            ...(0, utility_1.readImportMap)(options.rootDir, outDir).imports,
            ...(0, workspaces_1.readWorkspaces)(options.rootDir).imports
        }
    };
    const squash = new Set(options.squash);
    const entryModules = (0, entry_modules_1.collectEntryModules)(resolveOptions, squash);
    const isModule = /\.m?[tj]sx?$/;
    const ignore = function () {
    };
    const resolveImport = async (url, importer) => {
        let { hostname, pathname, search } = (0, fast_url_parser_1.parse)(url);
        if (hostname !== null) {
            return url;
        }
        let resolved = importMap.imports[pathname];
        if (!resolved) {
            let [module, filename] = (0, es_import_utils_1.parseModuleUrl)(pathname);
            if (module && !importMap.imports[module]) {
                await bundleWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = path_1.posix.extname(filename);
                if (!ext) {
                    const basedir = importer ? path_1.default.dirname(importer) : options.rootDir;
                    filename = resolveFilename(module, filename, basedir);
                    ext = path_1.default.extname(filename);
                }
                const type = importer ? resolveModuleType(ext, importer) : null;
                if (type) {
                    search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
                }
                if (module) {
                    if (ext === ".js" || ext === ".mjs") {
                        let bundled = importMap.imports[path_1.posix.join(module, filename)];
                        if (bundled) {
                            resolved = bundled;
                        }
                        else {
                            let target = `${module}/${filename}`;
                            await bundleWebModule(target);
                            resolved = `/web_modules/${target}`;
                        }
                    }
                    else {
                        resolved = `/node_modules/${module}/${filename}`;
                    }
                }
                else {
                    resolved = filename;
                }
            }
        }
        if (search) {
            return resolved + search;
        }
        else {
            return resolved;
        }
    };
    function resolveFilename(module, filename, basedir) {
        let pathname, resolved;
        if (module) {
            pathname = resolve_1.default.sync(`${module}/${filename}`, resolveOptions);
            resolved = (0, es_import_utils_1.parseModuleUrl)((0, es_import_utils_1.pathnameToModuleUrl)(pathname))[1];
        }
        else {
            pathname = path_1.default.join(basedir, filename);
            resolved = filename;
        }
        try {
            let stats = (0, fs_1.statSync)(pathname);
            if (stats.isDirectory()) {
                pathname = path_1.default.join(pathname, "index");
                for (const ext of options.resolve.extensions) {
                    if ((0, fs_1.existsSync)(pathname + ext)) {
                        return `${resolved}/index${ext}`;
                    }
                }
            }
            return resolved;
        }
        catch (ignored) {
            for (const ext of options.resolve.extensions) {
                if ((0, fs_1.existsSync)(pathname + ext)) {
                    return `${resolved}${ext}`;
                }
            }
            return resolved;
        }
    }
    function resolveModuleType(ext, importer) {
        if (!isModule.test(ext) && isModule.test(importer)) {
            return "module";
        }
        else {
            return null;
        }
    }
    const pendingTasks = new Map();
    function bundleWebModule(source) {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        let pendingTask = pendingTasks.get(source);
        if (pendingTask === undefined) {
            pendingTasks.set(source, pendingTask = bundleWebModuleTask(source));
        }
        return pendingTask;
    }
    let stylePlugin = (0, esbuild_sass_plugin_1.sassPlugin)({
        basedir: options.rootDir,
        cache: false,
        type: "style"
    });
    let ready = Promise.all([
        cjs_entry_proxy_1.parseCjsReady,
        esm_entry_proxy_1.parseEsmReady
    ]);
    let resolveEntryFile = function (source) {
        try {
            return resolve_1.default.sync(source, resolveOptions);
        }
        catch (error) {
            tiny_node_logger_1.default.warn("nothing to bundle for:", chalk_1.default.magenta(source), `(${chalk_1.default.gray(error.message)})`);
            return null;
        }
    };
    async function bundleWebModuleTask(source) {
        let startTime = Date.now();
        tiny_node_logger_1.default.debug("bundling web module:", source);
        const bundleNotification = notify(`bundling web module: ${source}`, "info");
        try {
            const entryFile = resolveEntryFile(source);
            if (!entryFile) {
                importMap.imports[source] = `/web_modules/${source}`;
                notify(`nothing to bundle for: ${source}`, "success", true);
                return;
            }
            let entryUrl = (0, es_import_utils_1.pathnameToModuleUrl)(entryFile);
            let pkg = (0, utility_1.closestManifest)(entryFile);
            let isESM = pkg.module || pkg["jsnext:main"]
                || entryFile.endsWith(".mjs")
                || entryFile.indexOf("\\es\\") > 0
                || entryFile.indexOf("\\esm\\") > 0;
            const [entryModule, pathname] = (0, es_import_utils_1.parseModuleUrl)(source);
            if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                await bundleWebModule(entryModule);
            }
            let outName = `${(0, utility_1.stripExt)(source)}.js`;
            let outUrl = `/web_modules/${outName}`;
            let outFile = path_1.default.join(outDir, outName);
            await ready;
            if (pathname) {
                await esbuild_1.default.build({
                    ...options.esbuild,
                    entryPoints: [entryUrl],
                    outfile: outFile,
                    plugins: [stylePlugin, {
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({ filter: /./ }, async ({ path: url, importer }) => {
                                    if ((0, es_import_utils_1.isBare)(url)) {
                                        if (url === entryUrl) {
                                            return { path: entryFile };
                                        }
                                        let webModuleUrl = importMap.imports[url];
                                        if (webModuleUrl) {
                                            return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                        }
                                        let [m] = (0, es_import_utils_1.parseModuleUrl)(url);
                                        if (entryModules.has(m)) {
                                            return {
                                                path: await resolveImport(url),
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                        return null;
                                    }
                                    else {
                                        let bareUrl = resolveToBareUrl(importer, url);
                                        let webModuleUrl = importMap.imports[bareUrl];
                                        if (webModuleUrl) {
                                            return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                        }
                                        return null;
                                    }
                                });
                            }
                        }]
                });
            }
            else {
                let entryProxy = isESM ? (0, esm_entry_proxy_1.generateEsmProxy)(entryFile) : (0, cjs_entry_proxy_1.generateCjsProxy)(entryFile);
                let imported = new Set(entryProxy.imports);
                let external = new Set(entryProxy.external);
                if (external.size) {
                    tiny_node_logger_1.default.warn(`${source} has ${external.size} externals: ${external.size < 20 ? entryProxy.external : "..."}`);
                }
                await esbuild_1.default.build({
                    ...options.esbuild,
                    stdin: {
                        contents: entryProxy.code,
                        resolveDir: options.rootDir,
                        sourcefile: `entry-proxy`,
                        loader: "js"
                    },
                    outfile: outFile,
                    plugins: [stylePlugin, {
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({ filter: /./ }, async ({ path: url, importer }) => {
                                    if ((0, es_import_utils_1.isBare)(url)) {
                                        if (imported.has(url)) {
                                            let webModuleUrl = importMap.imports[url];
                                            if (webModuleUrl) {
                                                imported.delete(url);
                                                return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                            }
                                            return null;
                                        }
                                        let [m] = (0, es_import_utils_1.parseModuleUrl)(url);
                                        if (entryModules.has(m)) {
                                            return {
                                                path: await resolveImport(url),
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                        return null;
                                    }
                                    if (external.has(url) && false) {
                                        let bareUrl = resolveToBareUrl(importer, url);
                                        return {
                                            path: `/web_modules/${bareUrl}`,
                                            external: true,
                                            namespace: "web_modules"
                                        };
                                    }
                                    return null;
                                });
                            }
                        }]
                });
                for (const i of imported) {
                    if (!importMap.imports[i]) {
                        importMap.imports[i] = outUrl;
                    }
                    else {
                        tiny_node_logger_1.default.warn("an import mapping already exists for:", i, "and is:", importMap.imports[i]);
                    }
                }
            }
            importMap.imports[source] = outUrl;
            importMap.imports[entryUrl] = outUrl;
            await Promise.all([
                (0, replace_require_1.replaceRequire)(outFile, resolveImport, options.esbuild.sourcemap),
                (0, utility_1.writeImportMap)(outDir, importMap)
            ]);
            const elapsed = Date.now() - startTime;
            tiny_node_logger_1.default.info `bundled: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(String(elapsed))}ms`;
            bundleNotification.update(`bundled: ${source} in: ${elapsed}ms`, "success");
        }
        finally {
            pendingTasks.delete(source);
        }
    }
    function resolveToBareUrl(importer, url) {
        let absolute = resolve_1.default.sync(path_1.default.join(path_1.default.dirname(importer), url), resolveOptions);
        return (0, es_import_utils_1.pathnameToModuleUrl)(absolute);
    }
    return {
        options,
        outDir,
        importMap,
        resolveImport,
        bundleWebModule
    };
});
//# sourceMappingURL=web-modules.js.map