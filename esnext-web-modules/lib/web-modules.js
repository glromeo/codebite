"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_json_1 = __importDefault(require("@rollup/plugin-json"));
const plugin_node_resolve_1 = require("@rollup/plugin-node-resolve");
const plugin_replace_1 = __importDefault(require("@rollup/plugin-replace"));
const chalk_1 = __importDefault(require("chalk"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importStar(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const rollup_1 = require("rollup");
const rollup_plugin_sourcemaps_1 = __importDefault(require("rollup-plugin-sourcemaps"));
const rollup_plugin_terser_1 = require("rollup-plugin-terser");
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const es_import_utils_1 = require("./es-import-utils");
const rollup_plugin_catch_unresolved_1 = require("./rollup-plugin-catch-unresolved");
const rollup_plugin_cjs_proxy_1 = require("./rollup-plugin-cjs-proxy");
const rollup_plugin_esm_proxy_1 = require("./rollup-plugin-esm-proxy");
const rollup_plugin_rewrite_imports_1 = require("./rollup-plugin-rewrite-imports");
const workspaces_1 = require("./workspaces");
function defaultOptions() {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}
exports.defaultOptions = defaultOptions;
function initFileSystem(rootDir, clean) {
    const outDir = path_1.default.join(rootDir, "web_modules");
    if (clean && fs_1.existsSync(outDir)) {
        fs_1.rmdirSync(outDir, { recursive: true });
        tiny_node_logger_1.default.info("cleaned web_modules directory");
    }
    fs_1.mkdirSync(outDir, { recursive: true });
    return { outDir };
}
function readJson(filename) {
    return JSON.parse(fs_1.readFileSync(filename, "utf-8"));
}
exports.useWebModules = nano_memoize_1.default((options = defaultOptions()) => {
    const { outDir } = initFileSystem(options.rootDir, options.clean);
    if (!options.environment)
        options.environment = "development";
    if (!options.resolve)
        options.resolve = {};
    if (!options.resolve.paths)
        options.resolve.paths = [path_1.default.join(options.rootDir, "node_modules")];
    if (!options.resolve.extensions)
        options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external)
        options.external = ["@babel/runtime/**"];
    if (!options.rollup)
        options.rollup = {};
    if (!options.rollup.plugins)
        options.rollup.plugins = [];
    const ALREADY_RESOLVED = Promise.resolve();
    const resolveOptions = {
        basedir: options.rootDir,
        packageFilter(pkg, pkgfile) {
            return { main: pkg.module || pkg["jsnext:main"] || pkg.main };
        },
        ...options.resolve
    };
    const importMap = {
        imports: {
            ...readImportMap(outDir).imports,
            ...workspaces_1.readWorkspaces(options.rootDir).imports
        }
    };
    const appPkg = readJson(require.resolve("./package.json", { paths: [options.rootDir] }));
    const entryModules = collectEntryModules(appPkg);
    function collectDependencies(entryModule) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }
    function collectEntryModules(entryModule, entryModules = new Set(), visited = new Set()) {
        for (const dependency of collectDependencies(entryModule)) {
            if (visited.has(dependency)) {
                entryModules.add(dependency);
            }
            else
                try {
                    visited.add(dependency);
                    collectEntryModules(readManifest(dependency), entryModules, visited);
                }
                catch (ignored) {
                    visited.delete(dependency);
                }
        }
        return entryModules;
    }
    function readImportMap(outDir) {
        try {
            let importMap = JSON.parse(fs_1.readFileSync(`${outDir}/import-map.json`, "utf-8"));
            for (const [key, pathname] of Object.entries(importMap.imports)) {
                try {
                    let { mtime } = fs_1.statSync(path_1.default.join(options.rootDir, String(pathname)));
                    tiny_node_logger_1.default.debug("web_module:", chalk_1.default.green(key), "->", chalk_1.default.gray(pathname));
                }
                catch (e) {
                    delete importMap[key];
                }
            }
            return importMap;
        }
        catch (e) {
            return { imports: {} };
        }
    }
    function writeImportMap(outDir, importMap) {
        return fs_1.promises.writeFile(`${outDir}/import-map.json`, JSON.stringify(importMap, null, "  "));
    }
    const isModule = /\.m?[tj]sx?$/;
    async function resolveImport(url, basedir = process.cwd()) {
        let { hostname, pathname, search } = fast_url_parser_1.parse(url);
        if (hostname !== null) {
            return url;
        }
        let resolved = importMap.imports[pathname];
        if (!resolved) {
            let [module, filename] = es_import_utils_1.parsePathname(pathname);
            if (module !== null && !importMap.imports[module]) {
                await rollupWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = path_1.posix.extname(filename);
                if (!ext) {
                    ext = resolveExt(module, filename, basedir);
                    filename += ext;
                }
                if (!isModule.test(ext)) {
                    let type = resolveModuleType(ext, basedir);
                    search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
                    if (module) {
                        resolved = `/node_modules/${module}/${filename}`;
                    }
                    else {
                        resolved = filename;
                    }
                }
                else {
                    if (module) {
                        let bundled = importMap.imports[path_1.posix.join(module, filename)];
                        if (bundled) {
                            resolved = bundled;
                        }
                        else {
                            let target = `${module}/${filename}`;
                            await rollupWebModule(target);
                            resolved = `/web_modules/${target}`;
                        }
                    }
                    else {
                        resolved = filename;
                    }
                }
            }
        }
        if (search) {
            return resolved + search;
        }
        else {
            return resolved;
        }
    }
    function resolveExt(module, filename, basedir) {
        let pathname;
        if (module) {
            const resolved = resolve_1.default.sync(`${module}/${filename}`, resolveOptions);
            pathname = path_1.default.join(resolved.substring(0, resolved.lastIndexOf("node_modules" + path_1.default.sep)), "node_modules", module, filename);
        }
        else {
            pathname = path_1.default.join(basedir, filename);
        }
        try {
            let stats = fs_1.statSync(pathname);
            if (stats.isDirectory()) {
                pathname = path_1.default.join(pathname, "index");
                for (const ext of options.resolve.extensions) {
                    if (fs_1.existsSync(pathname + ext))
                        return `/index${ext}`;
                }
            }
            return "";
        }
        catch (ignored) {
            for (const ext of options.resolve.extensions) {
                if (fs_1.existsSync(pathname + ext))
                    return ext;
            }
            return "";
        }
    }
    function resolveModuleType(ext, basedir) {
        return "module";
    }
    function readManifest(module, deep = false) {
        return readJson(resolve_1.default.sync(`${module}/package.json`, resolveOptions));
    }
    function closestManifest(entryModule) {
        let dirname = path_1.default.dirname(entryModule);
        while (true)
            try {
                return readJson(`${dirname}/package.json`);
            }
            catch (e) {
                const parent = path_1.default.dirname(dirname);
                if (parent.endsWith("node_modules")) {
                    break;
                }
                dirname = parent;
            }
        throw new Error("No package.json found starting from: " + entryModule);
    }
    function getModuleDirectories(options) {
        const moduleDirectory = options.resolve.moduleDirectory;
        return Array.isArray(moduleDirectory) ? [...moduleDirectory] : moduleDirectory ? [moduleDirectory] : undefined;
    }
    const pluginCjsProxy = rollup_plugin_cjs_proxy_1.rollupPluginCjsProxy({ entryModules });
    const pluginEsmProxy = rollup_plugin_esm_proxy_1.rollupPluginEsmProxy({ entryModules });
    const pluginReplace = plugin_replace_1.default({
        "process.env.NODE_ENV": JSON.stringify(options.environment)
    });
    const pluginRewriteImports = rollup_plugin_rewrite_imports_1.rollupPluginRewriteImports({
        importMap,
        resolveImport,
        entryModules,
        resolveOptions,
        external: options.external
    });
    const pluginEsmNodeResolve = plugin_node_resolve_1.nodeResolve({
        rootDir: options.rootDir,
        mainFields: ["browser:module", "module", "browser", "main"],
        extensions: [".mjs", ".cjs", ".js", ".json"],
        preferBuiltins: true,
        moduleDirectories: getModuleDirectories(options)
    });
    const pluginCjsNodeResolve = plugin_node_resolve_1.nodeResolve({
        rootDir: options.rootDir,
        mainFields: ["main"],
        extensions: [".cjs", ".js", ".json"],
        preferBuiltins: true,
        moduleDirectories: getModuleDirectories(options)
    });
    const pluginCommonJS = plugin_commonjs_1.default();
    const pluginJson = plugin_json_1.default({
        preferConst: true,
        indent: "  ",
        compact: false,
        namedExports: true
    });
    const pluginSourcemaps = rollup_plugin_sourcemaps_1.default();
    const pluginTerser = rollup_plugin_terser_1.terser(options.terser);
    const pluginCatchUnresolved = rollup_plugin_catch_unresolved_1.rollupPluginCatchUnresolved();
    const pendingTasks = new Map();
    function rollupWebModule(source) {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        if (!pendingTasks.has(source)) {
            let [module, filename] = es_import_utils_1.parsePathname(source);
            pendingTasks.set(source, rollupWebModuleTask(module, filename)
                .catch(function (err) {
                tiny_node_logger_1.default.error("failed to rollup:", source, err);
                throw err;
            })
                .finally(function () {
                pendingTasks.delete(source);
            }));
        }
        return pendingTasks.get(source);
        async function rollupWebModuleTask(module, filename) {
            var _a, _b, _c;
            tiny_node_logger_1.default.info("rollup web module:", source);
            if (filename && !importMap.imports[module]) {
                await rollupWebModule(module);
            }
            const startTime = Date.now();
            let inputFilename;
            try {
                inputFilename = resolve_1.default.sync(source, resolveOptions);
            }
            catch (ignored) {
                if (filename) {
                    inputFilename = source;
                }
                else {
                    tiny_node_logger_1.default.info `nothing to roll up for: ${chalk_1.default.magenta(source)}`;
                    importMap.imports[module] = `/node_modules/${source}`;
                    await writeImportMap(outDir, importMap);
                    return;
                }
            }
            let pkg = closestManifest(inputFilename);
            let isEsm = pkg.module || pkg["jsnext:main"] || inputFilename.endsWith(".mjs");
            const bundle = await rollup_1.rollup({
                ...options.rollup,
                input: inputFilename,
                plugins: [
                    filename ? false : isEsm ? pluginEsmProxy : pluginCjsProxy,
                    pluginReplace,
                    pluginRewriteImports,
                    isEsm ? pluginEsmNodeResolve : pluginCjsNodeResolve,
                    pluginCommonJS,
                    pluginJson,
                    pluginSourcemaps,
                    options.terser ? pluginTerser : false,
                    pluginCatchUnresolved,
                    ...(options.rollup.plugins)
                ].filter(Boolean),
                treeshake: (_b = (_a = options.rollup) === null || _a === void 0 ? void 0 : _a.treeshake) !== null && _b !== void 0 ? _b : { moduleSideEffects: "no-external" },
                onwarn: warningHandler
            });
            try {
                let outFile = filename ? source : module + ".js";
                await bundle.write({
                    file: `${outDir}/${outFile}`,
                    sourcemap: !options.terser
                });
                let outputUrl = `/web_modules/${outFile}`;
                importMap.imports[source] = outputUrl;
                if (!filename) {
                    importMap.imports[module] = outputUrl;
                    for (const { meta } of bundle.cache.modules) {
                        const bundle = meta && ((_c = meta["entry-proxy"]) === null || _c === void 0 ? void 0 : _c.bundle);
                        if (bundle) {
                            for (const bare of bundle) {
                                if (!importMap.imports[bare]) {
                                    importMap.imports[bare] = outputUrl;
                                }
                                else {
                                    tiny_node_logger_1.default.warn("an import mapping already exists for:", bare);
                                }
                            }
                            break;
                        }
                    }
                }
                await writeImportMap(outDir, importMap);
            }
            finally {
                await bundle.close();
                const elapsed = Date.now() - startTime;
                tiny_node_logger_1.default.info `rolled up: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(elapsed)}ms`;
            }
        }
    }
    function warningHandler({ code, message, loc, importer }) {
        let level;
        switch (code) {
            case "THIS_IS_UNDEFINED":
                return;
            case "CIRCULAR_DEPENDENCY":
            case "NAMESPACE_CONFLICT":
            case "UNUSED_EXTERNAL_IMPORT":
                level = "debug";
                break;
            default:
                level = "warn";
        }
        tiny_node_logger_1.default[level](message, loc ? `in: ${loc.file} at line:${loc.line}, column:${loc.column}` : "");
    }
    return {
        outDir,
        importMap,
        resolveImport,
        rollupWebModule
    };
});
//# sourceMappingURL=web-modules.js.map