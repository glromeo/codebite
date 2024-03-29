import {TransformOptions} from "@babel/core";
import {FSWatcher, WatchOptions} from "chokidar";
import {CorsOptions} from "cors";
import {WebModulesOptions} from "esnext-web-modules";
import {Options} from "etag";
import Router, {HTTPVersion} from "find-my-way";
import fs from "fs";
import Server from "http-proxy";
import path from "path";
import log from "tiny-node-logger";
import {ServerOptions} from "./server";
import {MessagingOptions} from "./messaging";
import {LegacyOptions} from "sass";

export type FindMyWayMiddleware = (
    router: Router.Instance<HTTPVersion.V1 | HTTPVersion.V2>,
    options: ESNextOptions,
    watcher: FSWatcher
) => void;

export type ESNextOptions = WebModulesOptions & {
    rootDir: string
    log?: {
        level: "trace" | "debug" | "info" | "warn" | "error" | "nothing"
        details?: boolean
        compact?: boolean
    }
    http2?: "push" | "preload" | false
    server?: ServerOptions
    resources: string
    watcher?: WatchOptions
    router: Router.Config<HTTPVersion.V1 | HTTPVersion.V2>
    middleware: FindMyWayMiddleware[]
    proxy: { [path: string]: Server.ServerOptions }
    cors: CorsOptions
    etag: Options
    cache?: boolean
    encoding: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined
    transform: {
        include: string | string[]
        exclude: string | string[]
        preProcess?(filename: string, code: string): string
    }
    mount: { [path: string]: string }
    babel: TransformOptions
    sass: LegacyOptions<'sync'> & {moduleType?: "style"}
    messaging?: MessagingOptions
    plugins: (ESNextOptions|string)[]
}

function loadConfig(pathname: string): string {
    try {
        return require(path.resolve(pathname));
    } catch (error) {
        throw new Error(`Unable to load config '${pathname}' from '${process.cwd()}', ${error.message}`);
    }
}

function resolveConfig(pathname: string): string | null {
    try {
        return require.resolve(path.resolve(pathname));
    } catch (ignored) {
        return null;
    }
}

function assignConfig<V>(target: V, source: any) {
    if (source !== undefined && source !== null) {
        if (target instanceof Array && source instanceof Array) {
            const merged = new Set(target);
            for (const item of source) {
                merged.add(item);
            }
            target.length = 0;
            target.push(...merged);
        } else if (target instanceof Object && source instanceof Object) {
            for (const [k, v] of Object.entries<object>(source)) {
                if (target[k] && (v.constructor === Object || v.constructor === Array)) {
                    assignConfig(target[k], v);
                } else {
                    target[k] = v;
                }
            }
        }
    }
}

function statDirectory(pathname) {
    try {
        return fs.statSync(pathname);
    } catch (ignored) {
        throw new Error(`ENOENT: no such file or directory '${pathname}'`);
    }
}

function resolveDirectory(name) {
    const pathname = path.resolve(name);
    if (!statDirectory(pathname).isDirectory()) {
        throw new Error(`ENODIR: not a directory '${pathname}'`);
    }
    return pathname;
}

export function defaultOptions(args: Args): ESNextOptions {

    const baseDir = path.resolve(__dirname, "..");
    const rootDir = args.root ? resolveDirectory(args.root) : process.cwd();

    const readTextFileSync = (filename) => {
        try {
            return fs.readFileSync(path.resolve(rootDir, filename), "utf-8");
        } catch (ignored) {
            return fs.readFileSync(path.resolve(baseDir, filename), "utf-8");
        }
    };

    return Object.assign({
        rootDir,
        log: {
            level: "info"
        },
        http2: "push",
        server: {
            protocol: "https",
            host: "localhost",
            port: 3000,
            options: {
                get key() {
                    return readTextFileSync("cert/localhost.key");
                },
                get cert() {
                    return readTextFileSync("cert/localhost.crt");
                },
                allowHTTP1: true
            }
        },
        resources: path.resolve(baseDir, "resources"),
        watcher: {
            cwd: rootDir,
            atomic: false,
            ignored: [
                "node_modules/**",
                "web_modules/**"
            ]
        },
        router: {
            ignoreTrailingSlash: true,
            allowUnsafeRegex: true
        },
        middleware: [],
        proxy: {
            "/api": {target: "http://localhost:9000"}
        },
        cors: {
            origin: "*",
            methods: "GET, HEAD, PUT, POST, DELETE, PATCH",
            allowedHeaders: "X-Requested-With, Accept, Content-Type",
            credentials: true
        },
        cache: true,
        deflate: true,
        etag: {
            weak: false
        },
        mount: {
            "/": rootDir
        },
        babel: {
            babelrc: true,
            caller: {
                name: "esnext-server",
                supportsStaticESM: true
            },
            sourceType: "module",
            sourceMaps: true,
            plugins: [
                ["@babel/plugin-syntax-import-meta"],
                ["@babel/plugin-transform-runtime", {
                    "corejs": false,
                    "helpers": true,
                    "regenerator": false,
                    "useESModules": true,
                    "absoluteRuntime": false,
                    "version": "7.10.5"
                }]
            ]
        },
        sass: {
            extensions: [".scss", ".css", ".sass"],
            outputStyle: "expanded"
        }
    }, require("esnext-web-modules/web-modules.config.js"));
}

export type Args = {
    config?: string
    root?: string
    plugin?: string | string[]
    debug?: boolean
    production?: boolean
}

export function configure(args: Args = {}, override?): Readonly<ESNextOptions> {

    let options: ESNextOptions = defaultOptions(args);

    if (args.config) {
        assignConfig(options, loadConfig(args.config));
    } else {
        const rootConfig = resolveConfig(path.join(options.rootDir, "esnext-server.config"));
        const localConfig = resolveConfig("esnext-server.config");
        if (rootConfig) {
            if (localConfig !== rootConfig) {
                assignConfig(options, loadConfig(rootConfig));
            }
        } else {
            log.debug(`no config found in '${options.rootDir}'`);
        }
        if (localConfig) {
            assignConfig(options, loadConfig(localConfig));
        } else {
            log.debug(`no config found in '${process.cwd()}'`);
        }
    }

    if (override) {
        assignConfig(options, override);
    }

    const plugins = options.plugins || [];

    if (args.plugin) {
        const names = Array.isArray(args.plugin) ? args.plugin : [args.plugin];
        for (const name of names) try {
            plugins.push(require.resolve(name, {paths: [options.rootDir]}));
        } catch (error) {
            log.error("plugin '" + name + "' resolution failed:", error);
            process.exit(1);
        }
    }

    for (const plugin of plugins) try {
        assignConfig(options, typeof plugin === "string" ? require(plugin) : plugin);
    } catch (error) {
        log.error("plugin '" + plugin + "' loading failed:", error);
        process.exit(1);
    }

    if (options.log) {
        Object.assign(log, options.log);
    }

    if (args.debug) {
        log.level = "debug";
    }

    log.debug("configured:", options);

    return options;
}
