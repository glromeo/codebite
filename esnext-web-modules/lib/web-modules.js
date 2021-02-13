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
const esbuild_1 = require("esbuild");
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
function readImportMap(rootDir, outDir) {
    try {
        let importMap = JSON.parse(fs_1.readFileSync(`${outDir}/import-map.json`, "utf-8"));
        for (const [key, pathname] of Object.entries(importMap.imports)) {
            try {
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
function init({ rootDir, clean, init }) {
    const outDir = path_1.default.join(rootDir, "web_modules");
    if (clean && fs_1.existsSync(outDir)) {
        fs_1.rmdirSync(outDir, { recursive: true });
        tiny_node_logger_1.default.info("cleaned web_modules directory");
    }
    fs_1.mkdirSync(outDir, { recursive: true });
    const importMap = {
        imports: {
            ...readImportMap(rootDir, outDir).imports,
            ...workspaces_1.readWorkspaces(rootDir).imports
        }
    };
    if (init) {
    }
    return { outDir, importMap };
}
function readJson(filename) {
    return JSON.parse(fs_1.readFileSync(filename, "utf-8"));
}
function stripExt(filename) {
    const end = filename.lastIndexOf(".");
    return end > 0 ? filename.substring(0, end) : filename;
}
exports.useWebModules = nano_memoize_1.default((options = defaultOptions()) => {
    const { outDir, importMap } = init(options);
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
    const appPkg = readManifest(".");
    const squash = new Set(options.squash);
    const entryModules = collectEntryModules(appPkg);
    function collectDependencies(entryModule) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }
    function collectEntryModules(entryModule, entryModules = new Set(), visited = new Map(), ancestor) {
        for (const dependency of collectDependencies(entryModule))
            if (!squash.has(dependency)) {
                if (visited.has(dependency) && visited.get(dependency) !== ancestor) {
                    entryModules.add(dependency);
                }
                else
                    try {
                        visited.set(dependency, ancestor);
                        collectEntryModules(readManifest(dependency), entryModules, visited, ancestor || dependency);
                    }
                    catch (ignored) {
                        visited.delete(dependency);
                    }
            }
        return entryModules;
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
            let [module, filename] = es_import_utils_1.parseModuleUrl(pathname);
            if (module !== null && !importMap.imports[module]) {
                await esbuildWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = path_1.posix.extname(filename);
                if (!ext) {
                    filename = resolveFilename(module, filename, basedir);
                    ext = path_1.default.extname(filename);
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
    function resolveFilename(module, filename, basedir) {
        let pathname, resolved;
        if (module) {
            pathname = resolve_1.default.sync(`${module}/${filename}`, resolveOptions);
            resolved = es_import_utils_1.parseModuleUrl(es_import_utils_1.pathnameToModuleUrl(pathname))[1];
        }
        else {
            pathname = path_1.default.join(basedir, filename);
            resolved = filename;
        }
        try {
            let stats = fs_1.statSync(pathname);
            if (stats.isDirectory()) {
                pathname = path_1.default.join(pathname, "index");
                for (const ext of options.resolve.extensions) {
                    if (fs_1.existsSync(pathname + ext)) {
                        return `${resolved}/index${ext}`;
                    }
                }
            }
            return resolved;
        }
        catch (ignored) {
            for (const ext of options.resolve.extensions) {
                if (fs_1.existsSync(pathname + ext)) {
                    return `${resolved}${ext}`;
                }
            }
            return resolved;
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
    let esbuild;
    function esbuildWebModule(source) {
        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }
        if (!pendingTasks.has(source)) {
            pendingTasks.set(source, esbuildWebModuleTask(source)
                .catch(function (err) {
                tiny_node_logger_1.default.error("failed to esbuild:", source, err);
                throw err;
            })
                .finally(function () {
                pendingTasks.delete(source);
            }));
        }
        return pendingTasks.get(source);
        async function esbuildWebModuleTask(source) {
            tiny_node_logger_1.default.info("bundling web module:", source);
            let startTime = Date.now();
            try {
                let entryFile = resolve_1.default.sync(source, resolveOptions);
                let entryUrl = es_import_utils_1.pathnameToModuleUrl(entryFile);
                let pkg = closestManifest(entryFile);
                let [entryModule, pathname] = es_import_utils_1.parseModuleUrl(source);
                if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                    await esbuildWebModule(entryModule);
                }
                let outFile = `${stripExt(source)}.js`;
                let outUrl = `/web_modules/${outFile}`;
                if (pathname) {
                    await (esbuild || (esbuild = await esbuild_1.startService())).build({
                        ...options.esbuild,
                        entryPoints: [entryUrl],
                        outfile: path_1.default.join(outDir, outFile),
                        plugins: [{
                                name: "web_modules",
                                setup(build) {
                                    build.onResolve({ filter: /./ }, async function ({ path: url, importer }) {
                                        if (es_import_utils_1.isBare(url)) {
                                            if (url === entryUrl) {
                                                return { path: entryFile };
                                            }
                                            let webModuleUrl = importMap.imports[url];
                                            if (webModuleUrl) {
                                                return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                            }
                                            let [m] = es_import_utils_1.parseModuleUrl(url);
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
                                            return {
                                                path: `/web_modules/${bareUrl}`,
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                    });
                                }
                            }]
                    });
                }
                else {
                    let isESM = pkg.module || pkg["jsnext:main"]
                        || entryFile.endsWith(".mjs")
                        || entryFile.indexOf("\\es\\") > 0
                        || entryFile.indexOf("\\esm\\") > 0;
                    let entryProxy = isESM ? rollup_plugin_esm_proxy_1.generateEsmProxy(entryFile) : rollup_plugin_cjs_proxy_1.generateCjsProxy(entryFile);
                    let imported = new Set(entryProxy.imports);
                    let external = new Set(entryProxy.external);
                    await (esbuild || (esbuild = await esbuild_1.startService())).build({
                        ...options.esbuild,
                        stdin: {
                            contents: entryProxy.code,
                            resolveDir: options.rootDir,
                            sourcefile: `entry-proxy`,
                            loader: "js"
                        },
                        outfile: path_1.default.join(outDir, outFile),
                        plugins: [{
                                name: "web_modules",
                                setup(build) {
                                    build.onResolve({ filter: /./ }, async function ({ path: url, importer }) {
                                        if (es_import_utils_1.isBare(url)) {
                                            if (imported.has(url)) {
                                                let webModuleUrl = importMap.imports[url];
                                                if (webModuleUrl) {
                                                    imported.delete(url);
                                                    return { path: webModuleUrl, external: true, namespace: "web_modules" };
                                                }
                                                return null;
                                            }
                                            let [m] = es_import_utils_1.parseModuleUrl(url);
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
                    replaceRequire(outFile),
                    writeImportMap(outDir, importMap)
                ]);
            }
            catch (error) {
                importMap.imports[source] = `/web_modules/${source}`;
                tiny_node_logger_1.default.warn("unable to bundle:", source, error.message);
                await writeImportMap(outDir, importMap);
            }
            finally {
                const elapsed = Date.now() - startTime;
                tiny_node_logger_1.default.info `bundled: ${chalk_1.default.magenta(source)} in: ${chalk_1.default.magenta(String(elapsed))}ms`;
            }
        }
    }
    function resolveToBareUrl(importer, url) {
        let absolute = resolve_1.default.sync(path_1.default.join(path_1.default.dirname(importer), url), resolveOptions);
        return es_import_utils_1.pathnameToModuleUrl(absolute);
    }
    async function replaceRequire(outFile) {
        let out = fs_1.readFileSync(path_1.default.join(outDir, outFile), "utf-8");
        let requires = new Set();
        let re = /require\s*\(([^)]+)\)/g;
        for (let match = re.exec(out); match; match = re.exec(out)) {
            let required = match[1].trim().slice(1, -1);
            requires.add(await resolveImport(required));
        }
        if (requires.size) {
            let r = 0;
            let cjsImports = ``;
            let cjsRequire = `function require(name) {\n  switch(name) {\n`;
            for (const url of requires) {
                cjsImports += `import require$${r} from "${url}";\n`;
                cjsRequire += `    case "${url}": return require$${r++};\n`;
            }
            cjsRequire += `  }\n}\n`;
            let code = cjsImports + cjsRequire + out;
            fs_1.writeFileSync(path_1.default.join(outDir, outFile), code);
        }
    }
    return {
        outDir,
        importMap,
        resolveImport,
        esbuildWebModule
    };
});
//# sourceMappingURL=web-modules.js.map