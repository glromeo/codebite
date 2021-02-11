import chalk from "chalk";
import {BuildOptions, Service, startService} from "esbuild";
import {parse} from "fast-url-parser";
import {existsSync, mkdirSync, promises as fsp, readFileSync, rmdirSync, statSync, writeFileSync} from "fs";
import memoized from "nano-memoize";
import path, {posix} from "path";
import resolve, {Opts} from "resolve";
import log from "tiny-node-logger";
import {isBare, parseModuleUrl, pathnameToModuleUrl} from "./es-import-utils";
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
    clean?: boolean                 // cleans the contents of web_modules before init
    init?: boolean                  // bundle all the dependencies at startup
    environment: string
    resolve: Opts
    external: string | string[]
    squash?: string[];
    esbuild?: BuildOptions
};

export type ImportResolver = (url: string, basedir?: string) => Promise<string>;

export type EntryProxyResult = {
    code: string         // The entry proxy code
    imports: string[]    // Imports that will end up in the importMap as imports because they have been squashed in
    external: string[]   // Imports that have to be treated as external during the bundling of this module
}

export function defaultOptions(): WebModulesOptions {
    return require(require.resolve(`${process.cwd()}/web-modules.config.js`));
}

function readImportMap(rootDir: string, outDir: string): ImportMap {
    try {
        let importMap = JSON.parse(readFileSync(`${outDir}/import-map.json`, "utf-8"));

        for (const [key, pathname] of Object.entries(importMap.imports)) {
            try {
                // let {mtime} = statSync(path.join(rootDir, String(pathname)));
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

function init({rootDir, clean, init}: WebModulesOptions): { outDir: string, importMap: ImportMap } {

    const outDir = path.join(rootDir, "web_modules");
    if (clean && existsSync(outDir)) {
        rmdirSync(outDir, {recursive: true});
        log.info("cleaned web_modules directory");
    }
    mkdirSync(outDir, {recursive: true});

    const importMap = {
        imports: {
            ...readImportMap(rootDir, outDir).imports,
            ...readWorkspaces(rootDir).imports
        }
    };

    if (init) {
        // TODO: refactor the code to implement options.init
    }

    return {outDir, importMap};
}

function readJson(filename) {
    return JSON.parse(readFileSync(filename, "utf-8"));
}

function stripExt(filename: string) {
    const end = filename.lastIndexOf(".");
    return end > 0 ? filename.substring(0, end) : filename;
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

    const {outDir, importMap} = init(options);

    if (!options.environment) options.environment = "development";
    if (!options.resolve) options.resolve = {};
    if (!options.resolve.extensions) options.resolve.extensions = [".ts", ".tsx", ".js", ".jsx"];
    if (!options.external) options.external = ["@babel/runtime/**"];
    if (!options.esbuild) options.esbuild = {};

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
        packageFilter(pkg: any, pkgfile: string) {
            return {main: pkg.module || pkg["jsnext:main"] || pkg.main};
        },
        ...options.resolve
    } as Opts;

    const appPkg: PackageMeta = readManifest(".");

    const squash = new Set<string>(options.squash);

    // let debugDeps = "#dependencies\r\n", indent = "##";

    const entryModules = collectEntryModules(appPkg);

    // console.log(require('ascii-tree').generate(debugDeps));

    function collectDependencies(entryModule: PackageMeta) {
        return new Set([
            ...Object.keys(entryModule.dependencies || {}),
            ...Object.keys(entryModule.peerDependencies || {})
        ]);
    }

    function collectEntryModules(entryModule: PackageMeta, entryModules = new Set<string>(), visited = new Map<string, string>(), ancestor?: string) {
        for (const dependency of collectDependencies(entryModule)) if (!squash.has(dependency)) {
            // debugDeps += `${indent}${dependency}\r\n`;
            if (visited.has(dependency) && visited.get(dependency) !== ancestor) {
                entryModules.add(dependency);
            } else try {
                visited.set(dependency, ancestor!);
                // indent += "#";
                collectEntryModules(readManifest(dependency), entryModules, visited, ancestor || dependency);
                // indent = indent.slice(0, -1);
            } catch (ignored) {
                visited.delete(dependency);
            }
        }
        return entryModules;
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
            let [module, filename] = parseModuleUrl(pathname);
            if (module !== null && !importMap.imports[module]) {
                await esbuildWebModule(module);
                resolved = importMap.imports[module];
            }
            if (filename) {
                let ext = posix.extname(filename);
                if (!ext) {
                    filename = resolveFilename(module, filename, basedir);
                    ext = path.extname(filename);
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

    function resolveFilename(module: string | null, filename: string, basedir: string): string {
        let pathname, resolved;
        if (module) {
            pathname = resolve.sync(`${module}/${filename}`, resolveOptions);
            resolved = parseModuleUrl(pathnameToModuleUrl(pathname))[1]!;
        } else {
            pathname = path.join(basedir, filename);
            resolved = filename;
        }
        try {
            let stats = statSync(pathname);
            if (stats.isDirectory()) {
                pathname = path.join(pathname, "index");
                for (const ext of options.resolve.extensions!) {
                    if (existsSync(pathname + ext)) {
                        return `${resolved}/index${ext}`;
                    }
                }
            }
            return resolved;
        } catch (ignored) {
            for (const ext of options.resolve.extensions!) {
                if (existsSync(pathname + ext)) {
                    return `${resolved}${ext}`;
                }
            }
            return resolved;
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

    const pendingTasks = new Map<string, Promise<void>>();

    let esbuild: Service;

    /**
     *             _           _ _     ___        __   _     __  __           _       _
     *    ___  ___| |__  _   _(_) | __| \ \      / /__| |__ |  \/  | ___   __| |_   _| | ___
     *   / _ \/ __| '_ \| | | | | |/ _` |\ \ /\ / / _ \ '_ \| |\/| |/ _ \ / _` | | | | |/ _ \
     *  |  __/\__ \ |_) | |_| | | | (_| | \ V  V /  __/ |_) | |  | | (_) | (_| | |_| | |  __/
     *   \___||___/_.__/ \__,_|_|_|\__,_|  \_/\_/ \___|_.__/|_|  |_|\___/ \__,_|\__,_|_|\___|
     *
     * @param source
     */
    function esbuildWebModule(source: string): Promise<void> {

        if (importMap.imports[source]) {
            return ALREADY_RESOLVED;
        }

        if (!pendingTasks.has(source)) {
            pendingTasks.set(source, esbuildWebModuleTask(source)
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

        async function esbuildWebModuleTask(source: string): Promise<void> {

            log.info("bundling web module:", source);
            let startTime = Date.now();
            try {
                let entryFile = resolve.sync(source, resolveOptions);
                let entryUrl = pathnameToModuleUrl(entryFile);
                let pkg = closestManifest(entryFile);

                let [entryModule, pathname] = parseModuleUrl(source);
                if (entryModule && !importMap.imports[entryModule] && entryModule !== source) {
                    await esbuildWebModule(entryModule);
                }

                let outFile = `${stripExt(source)}.js`;
                let outUrl = `/web_modules/${outFile}`;

                if (pathname) {

                    await (esbuild || (esbuild = await startService())).build({
                        ...options.esbuild,
                        entryPoints: [entryUrl],
                        outfile: path.join(outDir, outFile),
                        plugins: [{
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({filter: /./}, async function ({path: url, importer}) {
                                    if (isBare(url)) {
                                        if (url === entryUrl) {
                                            return {path: entryFile};
                                        }
                                        let webModuleUrl = importMap.imports[url];
                                        if (webModuleUrl) {
                                            return {path: webModuleUrl, external: true, namespace: "web_modules"};
                                        }
                                        let [m] = parseModuleUrl(url);
                                        if (entryModules.has(m!)) {
                                            return {
                                                path: await resolveImport(url),
                                                external: true,
                                                namespace: "web_modules"
                                            };
                                        }
                                        return null;
                                    } else {
                                        let bareUrl = resolveToBareUrl(importer, url);
                                        let webModuleUrl = importMap.imports[bareUrl];
                                        if (webModuleUrl) {
                                            return {path: webModuleUrl, external: true, namespace: "web_modules"};
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

                } else {

                    let isESM = pkg.module || pkg["jsnext:main"]
                        || entryFile.endsWith(".mjs")
                        || entryFile.indexOf("\\es\\") > 0
                        || entryFile.indexOf("\\esm\\") > 0;

                    let entryProxy = isESM ? generateEsmProxy(entryFile) : generateCjsProxy(entryFile);
                    let imported = new Set(entryProxy.imports);
                    let external = new Set(entryProxy.external);

                    await (esbuild || (esbuild = await startService())).build({
                        ...options.esbuild,
                        stdin: {
                            contents: entryProxy.code,
                            resolveDir: options.rootDir,
                            sourcefile: `entry-proxy`,
                            loader: "js"
                        },
                        outfile: path.join(outDir, outFile),
                        plugins: [{
                            name: "web_modules",
                            setup(build) {
                                build.onResolve({filter: /./}, async function ({path: url, importer}) {
                                    if (isBare(url)) {
                                        if (imported.has(url)) {
                                            let webModuleUrl = importMap.imports[url];
                                            if (webModuleUrl) {
                                                imported.delete(url);
                                                return {path: webModuleUrl, external: true, namespace: "web_modules"};
                                            }
                                            return null;
                                        }
                                        let [m] = parseModuleUrl(url);
                                        if (entryModules.has(m!)) {
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
                                    // if (/^@ant-design\/icons\/es\/icons\//.test(bareUrl) && !bareUrl.endsWith("/index.js")) {
                                    //     return {path: `/web_modules/${bareUrl}`, external: true, namespace: "web_modules"};
                                    // }
                                    return null;
                                });
                            }
                        }]
                    });

                    for (const i of imported) {
                        if (!importMap.imports[i]) {
                            importMap.imports[i] = outUrl;
                        } else {
                            log.warn("an import mapping already exists for:", i, "and is:", importMap.imports[i]);
                        }
                    }
                }

                importMap.imports[source] = outUrl;
                importMap.imports[entryUrl] = outUrl;

                await Promise.all([
                    replaceRequire(outFile),
                    writeImportMap(outDir, importMap)
                ]);

            } catch (error) {
                importMap.imports[source] = `/web_modules/${source}`;
                log.warn("unable to bundle:", source, error.message);
                await writeImportMap(outDir, importMap);
            } finally {
                const elapsed = Date.now() - startTime;
                log.info`bundled: ${chalk.magenta(source)} in: ${chalk.magenta(elapsed)}ms`;
            }
        }
    }

    function resolveToBareUrl(importer, url) {
        let absolute = resolve.sync(path.join(path.dirname(importer), url), resolveOptions);
        return pathnameToModuleUrl(absolute);
    }

    async function replaceRequire(outFile) {

        let out = readFileSync(path.join(outDir, outFile), "utf-8");
        let requires = new Set<string>();
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
            writeFileSync(path.join(outDir, outFile), code);
        }
    }

    return {
        outDir,
        importMap,
        resolveImport,
        esbuildWebModule
    };
});
