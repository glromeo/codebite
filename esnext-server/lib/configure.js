"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.defaultOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
function loadConfig(pathname) {
    try {
        return require(path_1.default.resolve(pathname));
    }
    catch (error) {
        throw new Error(`Unable to load config '${pathname}' from '${process.cwd()}', ${error.message}`);
    }
}
function resolveConfig(pathname) {
    try {
        return require.resolve(path_1.default.resolve(pathname));
    }
    catch (ignored) {
        return null;
    }
}
function assignConfig(target, source) {
    if (source !== undefined && source !== null) {
        if (target instanceof Array && source instanceof Array) {
            const merged = new Set(target);
            for (const item of source) {
                merged.add(item);
            }
            target.length = 0;
            target.push(...merged);
        }
        else if (target instanceof Object && source instanceof Object) {
            for (const [k, v] of Object.entries(source)) {
                if (target[k] && (v.constructor === Object || v.constructor === Array)) {
                    assignConfig(target[k], v);
                }
                else {
                    target[k] = v;
                }
            }
        }
    }
}
function loadPlugin(module) {
    try {
        return require(`${module}/esnext-server.plugin`);
    }
    catch (error) {
        tiny_node_logger_1.default.error("plugin", module, "load failed", error);
        throw new Error(`Unable to load plugin '${module}' from '${process.cwd()}'`);
    }
}
function statDirectory(pathname) {
    try {
        return fs_1.default.statSync(pathname);
    }
    catch (ignored) {
        throw new Error(`ENOENT: no such file or directory '${pathname}'`);
    }
}
function resolveDirectory(name) {
    const pathname = path_1.default.resolve(name);
    if (!statDirectory(pathname).isDirectory()) {
        throw new Error(`ENODIR: not a directory '${pathname}'`);
    }
    return pathname;
}
function defaultOptions(args) {
    const baseDir = path_1.default.resolve(__dirname, "..");
    const rootDir = args.root ? resolveDirectory(args.root) : process.cwd();
    const readTextFileSync = (filename) => {
        try {
            return fs_1.default.readFileSync(path_1.default.resolve(rootDir, filename), "utf-8");
        }
        catch (ignored) {
            return fs_1.default.readFileSync(path_1.default.resolve(baseDir, filename), "utf-8");
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
        resources: path_1.default.resolve(baseDir, "resources"),
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
            "/api": { target: "http://localhost:9000" }
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
exports.defaultOptions = defaultOptions;
function configure(args = {}, override) {
    let options = defaultOptions(args);
    if (args.config) {
        assignConfig(options, loadConfig(args.config));
    }
    else {
        const rootConfig = resolveConfig(path_1.default.join(options.rootDir, "esnext-server.config"));
        const localConfig = resolveConfig("esnext-server.config");
        if (rootConfig) {
            if (localConfig !== rootConfig) {
                assignConfig(options, loadConfig(rootConfig));
            }
        }
        else {
            tiny_node_logger_1.default.debug(`no config found in '${options.rootDir}'`);
        }
        if (localConfig) {
            assignConfig(options, loadConfig(localConfig));
        }
        else {
            tiny_node_logger_1.default.debug(`no config found in '${process.cwd()}'`);
        }
    }
    if (override) {
        assignConfig(options, override);
    }
    if (args.module) {
        const modules = Array.isArray(args.module) ? args.module : [args.module];
        for (const module of modules) {
            assignConfig(options, loadPlugin(module));
        }
    }
    if (options.log) {
        Object.assign(tiny_node_logger_1.default, options.log);
    }
    if (args.debug) {
        tiny_node_logger_1.default.level = "debug";
    }
    tiny_node_logger_1.default.debug("configured:", options);
    return options;
}
exports.configure = configure;
//# sourceMappingURL=configure.js.map