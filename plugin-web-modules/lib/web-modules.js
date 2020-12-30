const log = require("tiny-node-logger");
const chalk = require("chalk");

const {memoize} = require("esnext-server-extras");
const {quickParseURL, isBare, nodeModuleBareUrl, parsePathname, toPosix} = require("esnext-server-extras");
const {mkdirSync, rmdirSync, existsSync, promises: fs} = require("fs");
const path = require("path");
const {posix} = path;
const {sync: resolveSync} = require("resolve");

const rollup = require("rollup");
const createPluginNodeResolve = require("@rollup/plugin-node-resolve").default;
const createPluginCommonjs = require("@rollup/plugin-commonjs");
const createPluginTerser = require("rollup-plugin-terser").terser;
const createPluginSourceMaps = require("rollup-plugin-sourcemaps");
const createPluginJson = require("@rollup/plugin-json");

const glob = require("glob");

module.exports.useWebModules = memoize(config => {

    const {
        rootDir,
        webModules = path.join(rootDir, "web_modules"),
        nodeModules = path.join(rootDir, "node_modules"),
        web_modules = {}
    } = config;

    const ignoredModules = new Set(web_modules.ignored || []);

    function rootDirRelative(pathname) {
        return "/" + toPosix(path.relative(rootDir, pathname));
    }

    const customResolveOptions = {
        basedir: rootDir,
        paths: nodeModules,
        extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx"]
    };

    if (config.clean) {
        rmdirSync(webModules, {recursive: true});
        log.info("cleaned web_modules directory");
    }
    mkdirSync(webModules, {recursive: true});

    const modules = new Map();

    const standalone = new Set(web_modules.standalone);

    function loadLocalPackage(origin) {

        log.debug("found local package:", origin);

        try {
            const packageJson = require(path.join(origin, "package.json"));
            const main = packageJson.module || packageJson["jsnext:main"] || packageJson.main;
            const {name, workspaces} = packageJson;

            const packageResolveOptions = {...customResolveOptions, basedir: origin};

            function resolve(pathname = ".") {
                return rootDirRelative(resolveSync(`./${pathname}`, packageResolveOptions));
            }

            modules.set(name, {
                local: true,
                name,
                main,
                origin,
                resolve
            });

            if (workspaces) {

                config.mount[`/node_modules`] = origin + "/node_modules";

                for (const workspace of workspaces) {
                    for (const packageJsonFile of glob.sync(workspace + "/package.json", {
                        cwd: origin,
                        nonnull: true
                    })) loadLocalPackage(path.dirname(path.join(origin, packageJsonFile)));
                }
            }

        } catch (ignored) {
            log.info("no package.json found at:", origin);
        }
    }

    async function resolveImport(basedir, url) {

        let {
            scheme,
            module,
            pathname,
            search
        } = quickParseURL(url);

        if (scheme !== undefined) {
            return url;
        }

        if (module !== undefined) {
            if (!ignoredModules.has(module)) {
                const webPkg = await resolveWebModule(module);
                const relativeUrl = await webPkg.resolve(pathname);
                pathname = webPkg.local ? relativeUrl : `/web_modules/${module}/${relativeUrl}`;
            } else {
                return `/node_modules/${url}`;
            }
        } else {
            if (pathname.startsWith("/")) {
                pathname = path.join(rootDir, pathname);
            }
            if (!pathname.endsWith("/")) {
                pathname = resolveSync(pathname, {basedir, extensions: customResolveOptions.extensions});
            } else if (pathname.startsWith("./")) {
                pathname = path.join(basedir, pathname);
            }
            pathname = rootDirRelative(pathname);
        }

        const ext = posix.extname(pathname);
        if (ext) {
            if (ext !== ".js" && ext !== ".mjs" && ext !== ".ts") {
                search = search ? "type=module&" + search : "type=module";
            }
        }

        if (search) {
            return pathname + "?" + search;
        } else {
            return pathname;
        }
    }

    async function readWebPackageFile(module, filename, encoding = "UTF-8") {
        const pathname = path.join(webModules, module, filename);
        return fs.readFile(pathname, encoding);
    }

    async function writeWebPackageFile(module, filename, content) {
        const pathname = path.join(webModules, module, filename);
        while (true) try {
            await fs.writeFile(pathname, content);
            return pathname;
        } catch (e) {
            if (e.code === "ENOENT") await fs.mkdir(path.dirname(pathname), {recursive: true});
        }
    }

    function hydrateWebPackage(webPkg) {
        return Object.freeze({
            ...(webPkg),
            bundle: new Set(webPkg.bundle),
            files: new Map(),
            async resolve(pathname) {

                if (!pathname) {
                    if (this.main) {
                        pathname = this.main;
                    } else {
                        throw new Error("web package doesn't have a main file");
                    }
                }

                if (this.bundle.has(pathname)) {
                    return this.main || pathname;
                }

                const ext = posix.extname(pathname);
                if (!ext) {
                    const absolute = path.join(this.origin, pathname);
                    pathname += path.extname(resolveSync(absolute, customResolveOptions));
                } else if (ext !== ".js" && ext !== ".mjs") {
                    const source = path.resolve(this.origin, pathname);
                    if (!existsSync(path.join(webModules, this.name, pathname))) { // todo: improve me
                        const content = await fs.readFile(source);
                        const target = await writeWebPackageFile(this.name, pathname, content);
                        log.info(`copied: ${source} to: ${target}`);
                    }
                    return pathname;
                }

                if (!this.files.has(pathname)) {
                    this.files.set(pathname, new Promise(async (resolve, reject) => {
                        try {
                            log.info(`resolving: ${this.name}/${pathname}`);
                            if (existsSync(path.join(webModules, this.name, pathname))) {
                                this.files.set(pathname, pathname);
                                resolve(pathname);
                            } else {
                                const {filename} = await rollupWebModule(this.name, pathname);
                                this.files.set(pathname, filename);
                                resolve(filename);
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }));
                }

                return this.files.get(pathname);
            }
        });
    }

    async function loadWebPackage(name) {
        return JSON.parse(await readWebPackageFile(name, "webpackage.json"));
    }

    function resolveMain(module, main) {
        if (!main) {
            return main;
        }
        if (!posix.extname(main)) {
            log.warn(module, "main missing ext:", main);
            main += ".js";
        }
        if (main.startsWith("./")) {
            main = main.substring(2);
        }
        return main;
    }

    async function createWebPackage(name) {

        const filename = resolveSync(posix.join(name, "package.json"), customResolveOptions);
        const pkg = JSON.parse(await fs.readFile(filename, "UTF-8"));
        const origin = path.dirname(filename);
        const main = pkg.module || pkg["jsnext:main"] || pkg.main;
        const dependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];

        if (!standalone.has(name)) for (const dependency of dependencies) {
            await resolveWebModule(dependency);
        }

        const webPkg = {
            name,
            main: resolveMain(name, main),
            origin,
            dependencies,
            bundle: []
        };

        if (main) {
            const {imports} = await rollupWebModule(name, main);
            webPkg.bundle = imports;

            const stats = await fs.stat(path.join(webModules, name, webPkg.main));
            webPkg.stats = {
                size: stats.size,
                atime: stats.atime.toUTCString(),
                mtime: stats.mtime.toUTCString(),
                ctime: stats.ctime.toUTCString(),
                birthtime: stats.birthtime.toUTCString()
            };

        } else {

            const utcDate = new Date().toUTCString();
            webPkg.bundle = [];
            webPkg.stats = {
                size: 0,
                atime: utcDate,
                mtime: utcDate,
                ctime: utcDate,
                birthtime: utcDate
            };
        }

        await writeWebPackageFile(name, "webpackage.json", JSON.stringify(webPkg, undefined, "  "));

        return webPkg;
    }

    function useModulesCache(fn) {
        return function (name) {
            if (!modules.has(name)) {
                modules.set(
                    name,
                    fn(name)
                        .then(module => {
                            modules.set(name, module);
                            return module;
                        })
                        .catch(error => {
                            log.error("failed to complete", fn.name, error);
                            modules.delete(name);
                            throw error;
                        })
                );
            }
            return modules.get(name);
        };
    }

    const resolveWebModule = useModulesCache(async function resolveWebModule(name) {
        try {
            log.info("load web package:", name);
            return hydrateWebPackage(await loadWebPackage(name));
        } catch (ignored) {
            log.info("create web package:", name);
            return hydrateWebPackage(await createWebPackage(name));
        }
    });

    async function createBundleEntryModule({modules}) {

        const exportNamedDeclarations = new Map();
        const exportAllDeclarations = new Set();
        const moduleCache = new Map();

        for (const module of modules) {
            const moduleUrl = nodeModuleBareUrl(module.id);
            moduleCache.set(moduleUrl, module);

            for (const s of module.ast.body) if (s.type === "ExportAllDeclaration") {
                let value = s.source.value;
                if (!isBare(value)) {
                    value = nodeModuleBareUrl(path.resolve(path.dirname(module.id), value));
                }
                exportAllDeclarations.add(value);
            }
            for (const s of module.ast.body) if (s.type === "ExportNamedDeclaration") {
                if (s.specifiers) {
                    for (const {exported} of s.specifiers) {
                        const {name} = exported;
                        exportNamedDeclarations.set(name, moduleUrl);
                    }
                }
                if (s.declaration) {
                    const {id, declarations} = s.declaration;
                    if (declarations) {
                        for (const {id} of declarations) {
                            const {name} = id;
                            exportNamedDeclarations.set(name, moduleUrl);
                        }
                    }
                    if (id) {
                        const {name} = id;
                        exportNamedDeclarations.set(name, moduleUrl);
                    }
                }
            }
        }

        const imports = new Map();
        for (const [id, value] of exportNamedDeclarations) {
            (imports.get(value) || imports.set(value, []).get(value)).push(id);
        }

        let code = "";
        for (const value of exportAllDeclarations) {
            code += `export * from "${value}";\n`;
            imports.delete(value);
        }
        for (const [value, identifiers] of imports) {
            code += `export {${[...identifiers].join(", ")}} from "${value}";\n`;
        }

        const mainModule = modules[modules.length - 1];
        for (const s of mainModule.ast.body) if (s.type === "ExportDefaultDeclaration") {
            code += `import __default from "${(nodeModuleBareUrl(mainModule.id))}";\n`;
            code += `export default __default;\n`;
            break;
        }

        return {code, moduleCache};
    }

    const pluginNodeResolve = createPluginNodeResolve({
        rootDir,
        moduleDirectories: customResolveOptions.paths,
        extensions: customResolveOptions.extensions
    });
    const pluginCommonjs = createPluginCommonjs();
    const pluginTerser = web_modules.terser && createPluginTerser(web_modules.terser);
    const pluginSourceMaps = createPluginSourceMaps();
    const pluginJson = createPluginJson();

    function isValidPathname(pathname) {
        return pathname !== undefined && pathname.charCodeAt(0) !== 0;
    }

    function rollupOnWarn({code, message, loc, importer}, warn) {
        if (code === "UNUSED_EXTERNAL_IMPORT" || code === "THIS_IS_UNDEFINED") return;
        if (code === "NON_EXISTENT_EXPORT") throw new Error(message);
        if (code === "UNRESOLVED_IMPORT" && importer.endsWith("commonjs-external")) {
            return;
        }
        if (loc) {
            log.warn(message, "in:", loc.file, "at line:", loc.line, "column:", loc.column);
        } else {
            log.warn(message);
        }
    }

    /**
     * Rollup Web Module
     *
     * @param module
     * @param filename
     * @returns {Promise<{filename: *, imports: []}|{filename: *, imports}|{code: string, map: null}|null|{external: boolean, id: string}|*>}
     */
    async function rollupWebModule(module, filename) {

        const startTime = Date.now();

        const bundle = await rollup.rollup({
            input: `${module}/${filename}`,
            plugins: [
                standalone.has(module) ? {
                    resolveId(source) {
                        const first = source.split("/")[0];
                        if (first === "@babel") {
                            if (source === "@babel/runtime/regenerator") {
                                return {id: "node_modules/@babel/runtime/regenerator/index.js", external: false};
                            } else {
                                return {id: "node_modules/" + source + ".js", external: false};
                            }
                        }
                        if (module !== first && first === "react") {
                            return {id: "/web_modules/react/index.js", external: true};
                        }
                        if (module !== first && first === "react-dom") {
                            return {id: "/web_modules/react-dom/index.js", external: true};
                        }
                        return null;
                    }
                } : {
                    name: "rollup-plugin-rewrite-web-modules",
                    resolveId(source, from) {
                        if (isValidPathname(source) && isValidPathname(from)) {
                            if (isBare(source)) {
                                if (!source.startsWith(module)) {
                                    return {id: `\0web_modules/${source}`, external: true};
                                }
                            } else {
                                const bare = nodeModuleBareUrl(path.resolve(path.dirname(from), source));
                                const {module, filename} = parsePathname(bare);
                                const webPkg = modules.get(module);
                                if (webPkg && webPkg.main) {
                                    if (webPkg.bundle.has(filename)) {
                                        return {id: `\0web_modules/${module}/${webPkg.main}`, external: true};
                                    } else {
                                        return {id: `\0web_modules/${bare}`, external: true};
                                    }
                                }
                            }
                        }
                        return null;
                    }
                },
                pluginJson,
                pluginNodeResolve,
                pluginCommonjs,
                standalone.has(module) && pluginTerser,
                pluginSourceMaps
            ],
            onwarn: rollupOnWarn
        });

        const {cache, watchFiles} = bundle;

        const imports = watchFiles.filter(isValidPathname).map(function moduleRelative(filename) {
            return nodeModuleBareUrl(filename).substring(module.length + 1);
        });

        filename = imports[0];

        let target;

        if (standalone.has(module)) {

            target = path.join(webModules, module, filename);

            await bundle.write({
                file: target,
                format: "esm",
                sourcemap: true
            });

        } else {

            const {code, moduleCache} = await createBundleEntryModule(cache);

            if (!code) {
                const source = cache.modules[0].code;
                await writeWebPackageFile(module, filename, source);
                return {
                    filename,
                    imports: []
                };
            }

            target = await writeWebPackageFile(module, filename, code);

            const bundle = await rollup.rollup({
                input: target,
                cache: cache,
                plugins: [
                    {
                        name: "rollup-plugin-resolve-web-modules",
                        async resolveId(source) {
                            return moduleCache.get(source) || null;
                        },
                        renderChunk(code) {
                            return {code: code.replace(/\0web_/g, "/web_"), map: null};
                        }
                    },
                    pluginCommonjs,
                    pluginTerser
                ]
            });

            await bundle.write({
                file: target,
                format: "esm",
                sourcemap: true
            });
        }

        const elapsed = Date.now() - startTime;
        log.info("rolled up:", chalk.magenta(target), "in:", chalk.magenta(elapsed) + "ms");

        return {
            filename,
            imports,
            elapsed
        };
    }

    modules.init = function () {
        modules.clear();
        loadLocalPackage(rootDir);
    };

    modules.init();

    return {
        modules,
        resolveImport,
        resolveWebModule,
        rollupWebModule
    };

});
