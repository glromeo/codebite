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
    const plugins = options.plugins || [];
    if (args.plugin) {
        const names = Array.isArray(args.plugin) ? args.plugin : [args.plugin];
        for (const name of names)
            try {
                plugins.push(require.resolve(name, { paths: [options.rootDir] }));
            }
            catch (error) {
                tiny_node_logger_1.default.error("plugin '" + name + "' resolution failed:", error);
                process.exit(1);
            }
    }
    for (const plugin of plugins)
        try {
            assignConfig(options, typeof plugin === "string" ? require(plugin) : plugin);
        }
        catch (error) {
            tiny_node_logger_1.default.error("plugin '" + plugin + "' loading failed:", error);
            process.exit(1);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZ3VyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSw0Q0FBb0I7QUFFcEIsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQXlDbkMsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSTtRQUNBLE9BQU8sT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUMxQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxXQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUNwRztBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJO1FBQ0EsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sT0FBTyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxNQUFTLEVBQUUsTUFBVztJQUMzQyxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxJQUFJLE1BQU0sWUFBWSxLQUFLLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFN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RUFBRSxPQUFPLENBQUMsQ0FBQztJQUVsQyxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBekRELDhCQXlEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQge0NvcnNPcHRpb25zfSBmcm9tIFwiY29yc1wiO1xyXG5pbXBvcnQge1dlYk1vZHVsZXNPcHRpb25zfSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCB7T3B0aW9uc30gZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IFJvdXRlciwge0hUVFBWZXJzaW9ufSBmcm9tIFwiZmluZC1teS13YXlcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBsb2cgZnJvbSBcInRpbnktbm9kZS1sb2dnZXJcIjtcclxuaW1wb3J0IHtTZXJ2ZXJPcHRpb25zfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcclxuaW1wb3J0IHtNZXNzYWdpbmdPcHRpb25zfSBmcm9tIFwiLi9tZXNzYWdpbmdcIjtcclxuaW1wb3J0IHtMZWdhY3lPcHRpb25zfSBmcm9tIFwic2Fzc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgRmluZE15V2F5TWlkZGxld2FyZSA9IChcclxuICAgIHJvdXRlcjogUm91dGVyLkluc3RhbmNlPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+LFxyXG4gICAgb3B0aW9uczogRVNOZXh0T3B0aW9ucyxcclxuICAgIHdhdGNoZXI6IEZTV2F0Y2hlclxyXG4pID0+IHZvaWQ7XHJcblxyXG5leHBvcnQgdHlwZSBFU05leHRPcHRpb25zID0gV2ViTW9kdWxlc09wdGlvbnMgJiB7XHJcbiAgICByb290RGlyOiBzdHJpbmdcclxuICAgIGxvZz86IHtcclxuICAgICAgICBsZXZlbDogXCJ0cmFjZVwiIHwgXCJkZWJ1Z1wiIHwgXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiB8IFwibm90aGluZ1wiXHJcbiAgICAgICAgZGV0YWlscz86IGJvb2xlYW5cclxuICAgICAgICBjb21wYWN0PzogYm9vbGVhblxyXG4gICAgfVxyXG4gICAgaHR0cDI/OiBcInB1c2hcIiB8IFwicHJlbG9hZFwiIHwgZmFsc2VcclxuICAgIHNlcnZlcj86IFNlcnZlck9wdGlvbnNcclxuICAgIHJlc291cmNlczogc3RyaW5nXHJcbiAgICB3YXRjaGVyPzogV2F0Y2hPcHRpb25zXHJcbiAgICByb3V0ZXI6IFJvdXRlci5Db25maWc8SFRUUFZlcnNpb24uVjEgfCBIVFRQVmVyc2lvbi5WMj5cclxuICAgIG1pZGRsZXdhcmU6IEZpbmRNeVdheU1pZGRsZXdhcmVbXVxyXG4gICAgcHJveHk6IHsgW3BhdGg6IHN0cmluZ106IFNlcnZlci5TZXJ2ZXJPcHRpb25zIH1cclxuICAgIGNvcnM6IENvcnNPcHRpb25zXHJcbiAgICBldGFnOiBPcHRpb25zXHJcbiAgICBjYWNoZT86IGJvb2xlYW5cclxuICAgIGVuY29kaW5nOiBcImd6aXBcIiB8IFwiYnJvdGxpXCIgfCBcImJyXCIgfCBcImRlZmxhdGVcIiB8IFwiZGVmbGF0ZS1yYXdcIiB8IHVuZGVmaW5lZFxyXG4gICAgdHJhbnNmb3JtOiB7XHJcbiAgICAgICAgaW5jbHVkZTogc3RyaW5nIHwgc3RyaW5nW11cclxuICAgICAgICBleGNsdWRlOiBzdHJpbmcgfCBzdHJpbmdbXVxyXG4gICAgICAgIHByZVByb2Nlc3M/KGZpbGVuYW1lOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IHN0cmluZ1xyXG4gICAgfVxyXG4gICAgbW91bnQ6IHsgW3BhdGg6IHN0cmluZ106IHN0cmluZyB9XHJcbiAgICBiYWJlbDogVHJhbnNmb3JtT3B0aW9uc1xyXG4gICAgc2FzczogTGVnYWN5T3B0aW9uczwnc3luYyc+ICYge21vZHVsZVR5cGU/OiBcInN0eWxlXCJ9XHJcbiAgICBtZXNzYWdpbmc/OiBNZXNzYWdpbmdPcHRpb25zXHJcbiAgICBwbHVnaW5zOiAoRVNOZXh0T3B0aW9uc3xzdHJpbmcpW11cclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZENvbmZpZyhwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUocGF0aC5yZXNvbHZlKHBhdGhuYW1lKSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGxvYWQgY29uZmlnICcke3BhdGhuYW1lfScgZnJvbSAnJHtwcm9jZXNzLmN3ZCgpfScsICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzb2x2ZUNvbmZpZyhwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUocGF0aC5yZXNvbHZlKHBhdGhuYW1lKSk7XHJcbiAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFzc2lnbkNvbmZpZzxWPih0YXJnZXQ6IFYsIHNvdXJjZTogYW55KSB7XHJcbiAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEFycmF5ICYmIHNvdXJjZSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IG5ldyBTZXQodGFyZ2V0KTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbWVyZ2VkLmFkZChpdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXQubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgdGFyZ2V0LnB1c2goLi4ubWVyZ2VkKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9iamVjdCAmJiBzb3VyY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXM8b2JqZWN0Pihzb3VyY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2tdICYmICh2LmNvbnN0cnVjdG9yID09PSBPYmplY3QgfHwgdi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNzaWduQ29uZmlnKHRhcmdldFtrXSwgdik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtrXSA9IHY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXREaXJlY3RvcnkocGF0aG5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGZzLnN0YXRTeW5jKHBhdGhuYW1lKTtcclxuICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVOT0VOVDogbm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeSAnJHtwYXRobmFtZX0nYCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlc29sdmVEaXJlY3RvcnkobmFtZSkge1xyXG4gICAgY29uc3QgcGF0aG5hbWUgPSBwYXRoLnJlc29sdmUobmFtZSk7XHJcbiAgICBpZiAoIXN0YXREaXJlY3RvcnkocGF0aG5hbWUpLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVOT0RJUjogbm90IGEgZGlyZWN0b3J5ICcke3BhdGhuYW1lfSdgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXRobmFtZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRPcHRpb25zKGFyZ3M6IEFyZ3MpOiBFU05leHRPcHRpb25zIHtcclxuXHJcbiAgICBjb25zdCBiYXNlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTtcclxuICAgIGNvbnN0IHJvb3REaXIgPSBhcmdzLnJvb3QgPyByZXNvbHZlRGlyZWN0b3J5KGFyZ3Mucm9vdCkgOiBwcm9jZXNzLmN3ZCgpO1xyXG5cclxuICAgIGNvbnN0IHJlYWRUZXh0RmlsZVN5bmMgPSAoZmlsZW5hbWUpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShyb290RGlyLCBmaWxlbmFtZSksIFwidXRmLThcIik7XHJcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShiYXNlRGlyLCBmaWxlbmFtZSksIFwidXRmLThcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XHJcbiAgICAgICAgcm9vdERpcixcclxuICAgICAgICBsb2c6IHtcclxuICAgICAgICAgICAgbGV2ZWw6IFwiaW5mb1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBodHRwMjogXCJwdXNoXCIsXHJcbiAgICAgICAgc2VydmVyOiB7XHJcbiAgICAgICAgICAgIHByb3RvY29sOiBcImh0dHBzXCIsXHJcbiAgICAgICAgICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsXHJcbiAgICAgICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGdldCBrZXkoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlYWRUZXh0RmlsZVN5bmMoXCJjZXJ0L2xvY2FsaG9zdC5rZXlcIik7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZ2V0IGNlcnQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlYWRUZXh0RmlsZVN5bmMoXCJjZXJ0L2xvY2FsaG9zdC5jcnRcIik7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYWxsb3dIVFRQMTogdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNvdXJjZXM6IHBhdGgucmVzb2x2ZShiYXNlRGlyLCBcInJlc291cmNlc1wiKSxcclxuICAgICAgICB3YXRjaGVyOiB7XHJcbiAgICAgICAgICAgIGN3ZDogcm9vdERpcixcclxuICAgICAgICAgICAgYXRvbWljOiBmYWxzZSxcclxuICAgICAgICAgICAgaWdub3JlZDogW1xyXG4gICAgICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvKipcIixcclxuICAgICAgICAgICAgICAgIFwid2ViX21vZHVsZXMvKipcIlxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICByb3V0ZXI6IHtcclxuICAgICAgICAgICAgaWdub3JlVHJhaWxpbmdTbGFzaDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dVbnNhZmVSZWdleDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWlkZGxld2FyZTogW10sXHJcbiAgICAgICAgcHJveHk6IHtcclxuICAgICAgICAgICAgXCIvYXBpXCI6IHt0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDo5MDAwXCJ9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb3JzOiB7XHJcbiAgICAgICAgICAgIG9yaWdpbjogXCIqXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZHM6IFwiR0VULCBIRUFELCBQVVQsIFBPU1QsIERFTEVURSwgUEFUQ0hcIixcclxuICAgICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFwiWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBDb250ZW50LVR5cGVcIixcclxuICAgICAgICAgICAgY3JlZGVudGlhbHM6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgIGRlZmxhdGU6IHRydWUsXHJcbiAgICAgICAgZXRhZzoge1xyXG4gICAgICAgICAgICB3ZWFrOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbW91bnQ6IHtcclxuICAgICAgICAgICAgXCIvXCI6IHJvb3REaXJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJhYmVsOiB7XHJcbiAgICAgICAgICAgIGJhYmVscmM6IHRydWUsXHJcbiAgICAgICAgICAgIGNhbGxlcjoge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJlc25leHQtc2VydmVyXCIsXHJcbiAgICAgICAgICAgICAgICBzdXBwb3J0c1N0YXRpY0VTTTogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiBcIm1vZHVsZVwiLFxyXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiB0cnVlLFxyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAgICBbXCJAYmFiZWwvcGx1Z2luLXN5bnRheC1pbXBvcnQtbWV0YVwiXSxcclxuICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLXJ1bnRpbWVcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29yZWpzXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaGVscGVyc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicmVnZW5lcmF0b3JcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ1c2VFU01vZHVsZXNcIjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBcImFic29sdXRlUnVudGltZVwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBcInZlcnNpb25cIjogXCI3LjEwLjVcIlxyXG4gICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2Fzczoge1xyXG4gICAgICAgICAgICBleHRlbnNpb25zOiBbXCIuc2Nzc1wiLCBcIi5jc3NcIiwgXCIuc2Fzc1wiXSxcclxuICAgICAgICAgICAgb3V0cHV0U3R5bGU6IFwiZXhwYW5kZWRcIlxyXG4gICAgICAgIH1cclxuICAgIH0sIHJlcXVpcmUoXCJlc25leHQtd2ViLW1vZHVsZXMvd2ViLW1vZHVsZXMuY29uZmlnLmpzXCIpKTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQXJncyA9IHtcclxuICAgIGNvbmZpZz86IHN0cmluZ1xyXG4gICAgcm9vdD86IHN0cmluZ1xyXG4gICAgcGx1Z2luPzogc3RyaW5nIHwgc3RyaW5nW11cclxuICAgIGRlYnVnPzogYm9vbGVhblxyXG4gICAgcHJvZHVjdGlvbj86IGJvb2xlYW5cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZShhcmdzOiBBcmdzID0ge30sIG92ZXJyaWRlPyk6IFJlYWRvbmx5PEVTTmV4dE9wdGlvbnM+IHtcclxuXHJcbiAgICBsZXQgb3B0aW9uczogRVNOZXh0T3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zKGFyZ3MpO1xyXG5cclxuICAgIGlmIChhcmdzLmNvbmZpZykge1xyXG4gICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBsb2FkQ29uZmlnKGFyZ3MuY29uZmlnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHJvb3RDb25maWcgPSByZXNvbHZlQ29uZmlnKHBhdGguam9pbihvcHRpb25zLnJvb3REaXIsIFwiZXNuZXh0LXNlcnZlci5jb25maWdcIikpO1xyXG4gICAgICAgIGNvbnN0IGxvY2FsQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhcImVzbmV4dC1zZXJ2ZXIuY29uZmlnXCIpO1xyXG4gICAgICAgIGlmIChyb290Q29uZmlnKSB7XHJcbiAgICAgICAgICAgIGlmIChsb2NhbENvbmZpZyAhPT0gcm9vdENvbmZpZykge1xyXG4gICAgICAgICAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcocm9vdENvbmZpZykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKGBubyBjb25maWcgZm91bmQgaW4gJyR7b3B0aW9ucy5yb290RGlyfSdgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxvY2FsQ29uZmlnKSB7XHJcbiAgICAgICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBsb2FkQ29uZmlnKGxvY2FsQ29uZmlnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKGBubyBjb25maWcgZm91bmQgaW4gJyR7cHJvY2Vzcy5jd2QoKX0nYCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBvdmVycmlkZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGx1Z2lucyA9IG9wdGlvbnMucGx1Z2lucyB8fCBbXTtcclxuXHJcbiAgICBpZiAoYXJncy5wbHVnaW4pIHtcclxuICAgICAgICBjb25zdCBuYW1lcyA9IEFycmF5LmlzQXJyYXkoYXJncy5wbHVnaW4pID8gYXJncy5wbHVnaW4gOiBbYXJncy5wbHVnaW5dO1xyXG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykgdHJ5IHtcclxuICAgICAgICAgICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUucmVzb2x2ZShuYW1lLCB7cGF0aHM6IFtvcHRpb25zLnJvb3REaXJdfSkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZy5lcnJvcihcInBsdWdpbiAnXCIgKyBuYW1lICsgXCInIHJlc29sdXRpb24gZmFpbGVkOlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBwbHVnaW4gb2YgcGx1Z2lucykgdHJ5IHtcclxuICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgdHlwZW9mIHBsdWdpbiA9PT0gXCJzdHJpbmdcIiA/IHJlcXVpcmUocGx1Z2luKSA6IHBsdWdpbik7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGxvZy5lcnJvcihcInBsdWdpbiAnXCIgKyBwbHVnaW4gKyBcIicgbG9hZGluZyBmYWlsZWQ6XCIsIGVycm9yKTtcclxuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubG9nKSB7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihsb2csIG9wdGlvbnMubG9nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJncy5kZWJ1Zykge1xyXG4gICAgICAgIGxvZy5sZXZlbCA9IFwiZGVidWdcIjtcclxuICAgIH1cclxuXHJcbiAgICBsb2cuZGVidWcoXCJjb25maWd1cmVkOlwiLCBvcHRpb25zKTtcclxuXHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxufVxyXG4iXX0=