import chalk from "chalk";
import * as esbuild from "esbuild";
import {BuildOptions} from "esbuild";
import {parse} from "fast-url-parser";
import {existsSync, mkdirSync, promises as fsp, readFileSync, rmdirSync, statSync} from "fs";
import memoized from "nano-memoize";
import path, {posix} from "path";
import resolve, {Opts} from "resolve";
import log from "tiny-node-logger";
import {bareNodeModule, parsePathname} from "./es-import-utils";
import {generateCjsProxy} from "./rollup-plugin-cjs-proxy";
import {generateEsmProxy} from "./rollup-plugin-esm-proxy";
import {readWorkspaces} from "./workspaces";

interface PackageMeta {
    name: string;
    version: string;
    dependencies: { [name: string]: string };
    peerDependencies: { [name: string]: string };
    devDependencies: { [name: string]: string };

    [key: string]: any;
}

export interface ImportMap {
    imports: { [packageName: string]: string };
}

export type WebModulesOptions = {
    rootDir: string
    clean?: boolean
    environment: string
    resolve: Opts
    external: string | string[]
    esbuild: BuildOptions
};

export type ImportResolver = (url: string, basedir?: string) => Promise<string>;

export function defaultOptions(): WebModulesOptions {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}

function initFileSystem(rootDir: string, clean?: boolean): { outDir: string } {
    const outDir = path.join(rootDir, "web_modules");
    if (clean && existsSync(outDir)) {
        rmdirSync(outDir, {recursive: true});
        log.info("cleaned web_modules directory");
    }
    mkdirSync(outDir, {recursive: true});
    return {outDir};
}

function readJson(filename) {
    return JSON.parse(readFileSync(filename, "utf-8"));
}

/**
 *   __        __   _       __  __           _       _
 *   \ \      / /__| |__   |  \/  | ___   __| |_   _| | ___  ___
 *    \ \ /\ / / _ \ '_ \  | |\/| |/ _ \ / _` | | | | |/ _ \/ __|
 *     \ V  V /  __/ |_) | | |  | | (_) | (_| | |_| | |  __/\__ \
 *      \_/\_/ \___|_.__/  |_|  |_|\___/ \__,_|\__,_|_|\___||___/
 *
 * @param config
 */
export const useWebModules = memoized((options: WebModulesOptions = defaultOptions()) => {

    const {outDir} = initFileSystem(options.rootDir, options.clean);

    if (!options.environment) options.environment = "development";
    if (!options.resolve) options.resolve = {};
    if (!options.resolve.paths) options.resolve.paths = [path.join(options.rootDir, "node_modules")];
    if (!options.resolve.extensions) options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external) options.external = ["@babel/runtime/**"];
    if (!options.esbuild) options.esbuild = {};
    if (!options.esbuild.plugins) options.esbuild.plugins = [];

    const ALREADY_RESOLVED = Promise.resolve();
    const resolveOptions = {
        basedir: options.rootDir,
        packageFilter(pkg: any, pkgfile: string) {
            return {main: pkg.module || pkg["jsnext:main"] || pkg.main};
        },
        ...options.resolve
    } as Opts;

    const importMap = {
        imports: {
            ...readImportMap(outDir).imports,
            ...readWorkspaces(options.rootDir).imports
        }
    };

    const appPkg: PackageMeta = readJson(require.resolve("./package.json", {paths: [options.rootDir]}));
    const entryModules = collectEntryModules(appPkg);

    function collectDependencies(entryModule: PackageMeta) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }

    function collectEntryModules(entryModule: PackageMeta, entryModules = new Set<string>(), visited = new Set<string>()) {
        for (const dependency of collectDependencies(entryModule)) {
            if (visited.has(dependency)) {
                entryModules.add(dependency);
            } else try {
                visited.add(dependency);
                collectEntryModules(readManifest(dependency), entryModules, visited);
            } catch (ignored) {
                visited.delete(dependency);
            }
        }
        return entryModules;
    }

    function readImportMap(outDir: string): ImportMap {
        try {
            let importMap = JSON.parse(readFileSync(`${outDir}/import-map.json`, "utf-8"));

            for (const [key, pathname] of Object.entries(importMap.imports)) {
                try {
                    let {mtime} = statSync(path.join(options.rootDir, String(pathname)));
                    log.debug("web_module:", chalk.green(key), "->", chalk.gray(pathname));
                } catch (e) {
                    delete importMap[key];
                }
            }

            return importMap;
        } catch (e) {
            return {imports: {}};
        }
    }

    function writeImportMap(outDir: string, importMap: ImportMap): Promise<void> {
        return fsp.writeFile(`${outDir}/import-map.json`, JSON.stringify(importMap, null, "  "));
    }

    const isModule = /\.m?[tj]sx?$/;

    /**
     *                       _          _____                           _
     *                      | |        |_   _|                         | |
     *   _ __ ___  ___  ___ | |_   _____ | | _ __ ___  _ __   ___  _ __| |_
     *  | '__/ _ \/ __|/ _ \| \ \ / / _ \| || '_ ` _ \| '_ \ / _ \| '__| __|
     *  | | |  __/\__ \ (_) | |\ V /  __/| || | | | | | |_) | (_) | |  | |_
     *  |_|  \___||___/\___/|_| \_/ \___\___/_| |_| |_| .__/ \___/|_|   \__|
     *                                                | |
     *                                                |_|
     *
     * @param url
     * @param basedir
     */
    async function resolveImport(url: string, basedir: string = process.cwd()): Promise<string> {
        let {
            hostname,
            pathname,
            search
        } = parse(url);

        if (hostname !== null) {
            return url;
        }

        let resolved = importMap.imports[pathname];
        if (!resolved) {
            let [module, filename] = parsePathname(pathname);
            if (module !== null && !importMap.imports[module]) {
                await esbuildWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = posix.extname(filename);
                if (!ext) {
                    ext = resolveExt(module, filename, basedir);
                    filename += ext;
                }
                if (!isModule.test(ext)) {
                    let type = resolveModuleType(ext, basedir);
                    search = search ? `?type=${type}&${search.slice(1)}` : `?type=${type}`;
                    if (module) {
                        resolved = `/node_modules/${module}/${filename}`;
                    } else {
                        resolved = filename;
                    }
                } else {
                    if (module) {
                        let bundled = importMap.imports[posix.join(module, filename)];
                        if (bundled) {
                            resolved = bundled;
                        } else {
                            let target = `${module}/${filename}`;
                            await esbuildWebModule(target);
                            resolved = `/web_modules/${target}`;
                        }
                    } else {
                        resolved = filename;
                    }
                }
            }
        }

        if (search) {
            return resolved + search;
        } else {
            return resolved;
        }
    }

    function resolveExt(module: string | null, filename: string, basedir: string) {
        let pathname;
        if (module) {
            const resolved = resolve.sync(`${module}/${filename}`, resolveOptions);
            pathname = path.join(resolved.substring(0, resolved.lastIndexOf("node_modules" + path.sep)), "node_modules", module, filename);
        } else {
            pathname = path.join(basedir, filename);
        }
        try {
            let stats = statSync(pathname);
            if (stats.isDirectory()) {
                pathname = path.join(pathname, "index");
                for (const ext of options.resolve.extensions!) {
                    if (existsSync(pathname + ext)) return `/index${ext}`;
                }
            }
            return "";
        } catch (ignored) {
            for (const ext of options.resolve.extensions!) {
                if (existsSync(pathname + ext)) return ext;
            }
            return "";
        }
    }

    function resolveModuleType(ext: string, basedir: string | undefined) {
        return "module";
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function readManifest(module: string, deep: boolean = false) {
        return readJson(resolve.sync(`${module}/package.json`, resolveOptions));
    }

    function closestManifest(entryModule: string) {
        let dirname = path.dirname(entryModule);
        while (true) try {
            return readJson(`${dirname}/package.json`);
        } catch (e) {
            const parent = path.dirname(dirname);
            if (parent.endsWith("node_modules")) {
                break;
            }
            dirname = parent;
        }
        throw new Error("No package.json found starting from: " + entryModule);
    }

    function getModuleDirectories(options: WebModulesOptions) {
        const moduleDirectory = options.resolve.moduleDirectory;
        return Array.isArray(moduleDirectory) ? [...moduleDirectory] : moduleDirectory ? [moduleDirectory] : undefined;
    }

    // const pluginEsmNodeResolve = esbuildPluginNodeResolve({
    //     rootDir: options.rootDir,
    //     mainFields: ["browser:module", "module", "browser", "main"],
    //     extensions: [".mjs", ".cjs", ".js", ".json"],
    //     preferBuiltins: true,
    //     moduleDirectories: getModuleDirectories(options)
    // });
    // const pluginCommonJS = esbuildPluginCommonJS();
    // const pluginJson = esbuildPluginJson({
    //     preferConst: true,
    //     indent: "  ",
    //     compact: false,
    //     namedExports: true
    // });
    // const pluginSourcemaps = esbuildPluginSourcemaps();
    // const pluginTerser = esbuildPluginTerser(options.terser);
    // const pluginCatchUnresolved = esbuildPluginCatchUnresolved();

    const pendingTasks = new Map<string, Promise<void>>();

    /**
     *              _ _         __          __  _     __  __           _       _
     *             | | |        \ \        / / | |   |  \/  |         | |     | |
     *    _ __ ___ | | |_   _ _ _\ \  /\  / /__| |__ | \  / | ___   __| |_   _| | ___
     *   | '__/ _ \| | | | | | '_ \ \/  \/ / _ \ '_ \| |\/| |/ _ \ / _` | | | | |/ _ \
     *   | | | (_) | | | |_| | |_) \  /\  /  __/ |_) | |  | | (_) | (_| | |_| | |  __/
     *   |_|  \___/|_|_|\__,_| .__/ \/  \/ \___|_.__/|_|  |_|\___/ \__,_|\__,_|_|\___|
     *                       | |
     *                       |_|
     *
     * @param source
     */
    function esbuildWebModule(source: string): Promise<void> {

        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }

        if (!pendingTasks.has(source)) {
            let [module, filename] = parsePathname(source) as [string, string | null];
            pendingTasks.set(source, esbuildWebModuleTask(module, filename)
                .catch(function (err) {
                    log.error("failed to esbuild:", source, err);
                    throw err;
                })
                .finally(function () {
                    pendingTasks.delete(source);
                })
            );
        }

        return pendingTasks.get(source)!;

        async function esbuildWebModuleTask(module: string, filename: string | null): Promise<void> {

            log.info("esbuild web module:", source);

            if (filename && !importMap.imports[module]) {
                await esbuildWebModule(module);
            }

            const startTime = Date.now();

            let inputFilename: string;
            try {
                inputFilename = resolve.sync(source, resolveOptions);
                let resolved = bareNodeModule(inputFilename);
                if (filename && resolved !== source) {
                    await esbuildWebModule(resolved);
                    log.info("aliasing:", source, "as:", resolved);
                    importMap.imports[source] = `/web_modules/${resolved}`;
                    return
                }
            } catch (ignored) {
                if (filename) {
                    inputFilename = source;
                } else {
                    log.info(`nothing to roll up for: ${chalk.magenta(source)}`);
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
                outfile: path.join(outDir, outFile),
                sourcemap: true,
                define: {
                    "process.env.NODE_ENV": `"${options.environment}"`,
                    ...options.esbuild.define
                },
                target:["chrome80"],
                plugins: [
                    {
                        name: "web_modules",
                        setup(build) {
                            build.onResolve({filter: /./}, args => {
                                //log.info("resolve:", args.path);
                                return null;
                            });
                            if (externals.length) {
                                build.onResolve({filter: new RegExp(`^(${externals.join("|")})`)}, async args => {
                                    let external = args.path;
                                    // todo: implement aliases
                                    // if (external.indexOf("@babel/runtime/helpers") >= 0 && external.indexOf("/esm") === -1) {
                                    //     external = external.replace("/helpers", "/helpers/esm");
                                    // }
                                    return {path: await resolveImport(external), external: true};
                                });
                            }
                            build.onResolve({filter: /^\.\.?\//}, args => {
                                let absolute = path.join(args.resolveDir, args.path);
                                let moduleBareUrl = bareNodeModule(absolute);
                                let resolved = importMap.imports[moduleBareUrl];
                                if (resolved) {
                                    return {path: resolved, external: true};
                                }
                                return null;
                            });
                            build.onLoad({filter: new RegExp(`^${inputFilename.replace(/[.\\]/g, '\\$&')}$`)}, async (args) => {
                                const {code, meta} = isEsm || args.path.indexOf("\\es\\") > 0 || args.path.indexOf("\\esm\\") > 0 ? generateEsmProxy(args.path) : generateCjsProxy(args.path);
                                bundle = meta && meta["entry-proxy"]?.bundle;
                                return {contents:code};
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
                            } else {
                                log.warn("an import mapping already exists for:", bare);
                            }
                        }
                    }
                }

                await writeImportMap(outDir, importMap);

            } finally {
                const elapsed = Date.now() - startTime;
                log.info`rolled up: ${chalk.magenta(source)} in: ${chalk.magenta(elapsed)}ms`;
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
