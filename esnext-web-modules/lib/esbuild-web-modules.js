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
const chalk_1 = __importDefault(require("chalk"));
const esbuild = __importStar(require("esbuild"));
const fast_url_parser_1 = require("fast-url-parser");
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importStar(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const es_import_utils_1 = require("./es-import-utils");
const rollup_plugin_cjs_proxy_1 = require("./rollup-plugin-cjs-proxy");
const rollup_plugin_esm_proxy_1 = require("./rollup-plugin-esm-proxy");
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
    if (!options.esbuild)
        options.esbuild = {};
    if (!options.esbuild.plugins)
        options.esbuild.plugins = [];
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
                await esbuildWebModule(module);
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
                            await esbuildWebModule(target);
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
    const pendingTasks = new Map();
    function esbuildWebModule(source) {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        if (!pendingTasks.has(source)) {
            let [module, filename] = es_import_utils_1.parsePathname(source);
            pendingTasks.set(source, esbuildWebModuleTask(module, filename)
                .catch(function (err) {
                tiny_node_logger_1.default.error("failed to esbuild:", source, err);
                throw err;
            })
                .finally(function () {
                pendingTasks.delete(source);
            }));
        }
        return pendingTasks.get(source);
        async function esbuildWebModuleTask(module, filename) {
            tiny_node_logger_1.default.info("esbuild web module:", source);
            if (filename && !importMap.imports[module]) {
                await esbuildWebModule(module);
            }
            const startTime = Date.now();
            let inputFilename;
            try {
                inputFilename = resolve_1.default.sync(source, resolveOptions);
                let resolved = es_import_utils_1.bareNodeModule(inputFilename);
                if (filename && resolved !== source) {
                    await esbuildWebModule(resolved);
                    tiny_node_logger_1.default.info("aliasing:", source, "as:", resolved);
                    importMap.imports[source] = `/web_modules/${resolved}`;
                    return;
                }
            }
            catch (ignored) {
                if (filename) {
                    inputFilename = source;
                }
                else {
                    tiny_node_logger_1.default.info(`nothing to roll up for: ${chalk_1.default.magenta(source)}`);
                    importMap.imports[module] = `/node_modules/${source}`;
                    await writeImportMap(outDir, importMap);
                    return;
                }
            }
            let pkg = closestManifest(inputFilename);
            let isEsm = pkg.module || pkg["jsnext:main"] || inputFilename.endsWith(".mjs");
            let externals = [...entryModules].filter(m => m !== module);
            let outFile = filename ? source : module + ".js";
            let bundle;
            await esbuild.build({
                ...options.esbuild,
                entryPoints: [inputFilename],
                bundle: true,
                format: "esm",
                outfile: path_1.default.join(outDir, outFile),
                sourcemap: true,
                define: {
                    "process.env.NODE_ENV": `"${options.environment}"`,
                    ...options.esbuild.define
                },
                target: ["chrome80"],
                plugins: [
                    {
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({ filter: /./ }, args => {
                                return null;
                            });
                            if (externals.length) {
                                build.onResolve({ filter: new RegExp(`^(${externals.join("|")})`) }, async (args) => {
                                    let external = args.path;
                                    return { path: await resolveImport(external), external: true };
                                });
                            }
                            build.onResolve({ filter: /^\.\.?\// }, args => {
                                let absolute = path_1.default.join(args.resolveDir, args.path);
                                let moduleBareUrl = es_import_utils_1.bareNodeModule(absolute);
                                let resolved = importMap.imports[moduleBareUrl];
                                if (resolved) {
                                    return { path: resolved, external: true };
                                }
                                return null;
                            });
                            build.onLoad({ filter: new RegExp(`^${inputFilename.replace(/[.\\]/g, '\\$&')}$`) }, async (args) => {
                                var _a;
                                const { code, meta } = isEsm || args.path.indexOf("\\es\\") > 0 || args.path.indexOf("\\esm\\") > 0 ? rollup_plugin_esm_proxy_1.generateEsmProxy(args.path) : rollup_plugin_cjs_proxy_1.generateCjsProxy(args.path);
                                bundle = meta && ((_a = meta["entry-proxy"]) === null || _a === void 0 ? void 0 : _a.bundle);
                                return { contents: code };
                            });
                        }
                    },
                    ...options.esbuild.plugins || []
                ]
            });
            try {
                let outputUrl = `/web_modules/${outFile}`;
                importMap.imports[source] = outputUrl;
                if (!filename) {
                    importMap.imports[module] = outputUrl;
                    if (bundle) {
                        for (const bare of bundle) {
                            if (!importMap.imports[bare]) {
                                importMap.imports[bare] = outputUrl;
                            }
                            else {
                                tiny_node_logger_1.default.warn("an import mapping already exists for:", bare);
                            }
                        }
                    }
                }
                await writeImportMap(outDir, importMap);
            }
            finally {
                const elapsed = Date.now() - startTime;
                tiny_node_logger_1.default.info `rolled up: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(elapsed)}ms`;
            }
        }
    }
    return {
        outDir,
        importMap,
        resolveImport,
        esbuildWebModule
    };
});
//# sourceMappingURL=esbuild-web-modules.js.map