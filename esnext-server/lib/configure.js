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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZ3VyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSw0Q0FBb0I7QUFHcEIsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQW9DbkMsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSTtRQUNBLE9BQU8sT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUMxQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxXQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUNwRztBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJO1FBQ0EsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sT0FBTyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxNQUFTLEVBQUUsTUFBVztJQUMzQyxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxJQUFJLE1BQU0sWUFBWSxLQUFLLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFN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YUFBTTtZQUNILDBCQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3REO0tBQ0o7SUFFRCxJQUFJLFFBQVEsRUFBRTtRQUNWLFlBQVksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDbkM7SUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDYixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekUsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUU7WUFDMUIsWUFBWSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUM3QztLQUNKO0lBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBTSxDQUFDLE1BQU0sQ0FBQywwQkFBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNuQztJQUVELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNaLDBCQUFHLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztLQUN2QjtJQUVELDBCQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVsQyxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFDO0FBN0NELDhCQTZDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHJhbnNmb3JtT3B0aW9uc30gZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xyXG5pbXBvcnQge0NvcnNPcHRpb25zfSBmcm9tIFwiY29yc1wiO1xyXG5pbXBvcnQge1dlYk1vZHVsZXNPcHRpb25zfSBmcm9tIFwiZXNuZXh0LXdlYi1tb2R1bGVzXCI7XHJcbmltcG9ydCB7T3B0aW9uc30gZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IFJvdXRlciwge0hUVFBWZXJzaW9ufSBmcm9tIFwiZmluZC1teS13YXlcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XHJcbmltcG9ydCB7U3luY09wdGlvbnN9IGZyb20gXCJub2RlLXNhc3NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge1NlcnZlck9wdGlvbnN9IGZyb20gXCIuL3NlcnZlclwiO1xyXG5cclxuZXhwb3J0IHR5cGUgRmluZE15V2F5TWlkZGxld2FyZSA9IChcclxuICAgIHJvdXRlcjogUm91dGVyLkluc3RhbmNlPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+LFxyXG4gICAgb3B0aW9uczogRVNOZXh0T3B0aW9ucyxcclxuICAgIHdhdGNoZXI6IEZTV2F0Y2hlclxyXG4pID0+IHZvaWQ7XHJcblxyXG5leHBvcnQgdHlwZSBFU05leHRPcHRpb25zID0gV2ViTW9kdWxlc09wdGlvbnMgJiB7XHJcbiAgICByb290RGlyOiBzdHJpbmdcclxuICAgIGxvZz86IHtcclxuICAgICAgICBsZXZlbDogXCJ0cmFjZVwiIHwgXCJkZWJ1Z1wiIHwgXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiB8IFwibm90aGluZ1wiXHJcbiAgICAgICAgZGV0YWlscz86IGJvb2xlYW5cclxuICAgICAgICBjb21wYWN0PzogYm9vbGVhblxyXG4gICAgfVxyXG4gICAgaHR0cDI/OiBcInB1c2hcIiB8IFwicHJlbG9hZFwiIHwgZmFsc2VcclxuICAgIHNlcnZlcj86IFNlcnZlck9wdGlvbnNcclxuICAgIHJlc291cmNlczogc3RyaW5nXHJcbiAgICB3YXRjaGVyPzogV2F0Y2hPcHRpb25zXHJcbiAgICByb3V0ZXI6IFJvdXRlci5Db25maWc8SFRUUFZlcnNpb24uVjEgfCBIVFRQVmVyc2lvbi5WMj5cclxuICAgIG1pZGRsZXdhcmU6IEZpbmRNeVdheU1pZGRsZXdhcmVbXVxyXG4gICAgcHJveHk6IHsgW3BhdGg6IHN0cmluZ106IFNlcnZlci5TZXJ2ZXJPcHRpb25zIH1cclxuICAgIGNvcnM6IENvcnNPcHRpb25zXHJcbiAgICBldGFnOiBPcHRpb25zXHJcbiAgICBjYWNoZT86IGJvb2xlYW5cclxuICAgIGVuY29kaW5nOiBcImd6aXBcIiB8IFwiYnJvdGxpXCIgfCBcImJyXCIgfCBcImRlZmxhdGVcIiB8IFwiZGVmbGF0ZS1yYXdcIiB8IHVuZGVmaW5lZFxyXG4gICAgdHJhbnNmb3JtOiB7XHJcbiAgICAgICAgaW5jbHVkZTogc3RyaW5nIHwgc3RyaW5nW11cclxuICAgICAgICBleGNsdWRlOiBzdHJpbmcgfCBzdHJpbmdbXVxyXG4gICAgfVxyXG4gICAgbW91bnQ6IHsgW3BhdGg6IHN0cmluZ106IHN0cmluZyB9XHJcbiAgICBiYWJlbDogVHJhbnNmb3JtT3B0aW9uc1xyXG4gICAgc2FzczogU3luY09wdGlvbnNcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZENvbmZpZyhwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUocGF0aC5yZXNvbHZlKHBhdGhuYW1lKSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGxvYWQgY29uZmlnICcke3BhdGhuYW1lfScgZnJvbSAnJHtwcm9jZXNzLmN3ZCgpfScsICR7ZXJyb3IubWVzc2FnZX1gKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzb2x2ZUNvbmZpZyhwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUocGF0aC5yZXNvbHZlKHBhdGhuYW1lKSk7XHJcbiAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFzc2lnbkNvbmZpZzxWPih0YXJnZXQ6IFYsIHNvdXJjZTogYW55KSB7XHJcbiAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEFycmF5ICYmIHNvdXJjZSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IG5ldyBTZXQodGFyZ2V0KTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgbWVyZ2VkLmFkZChpdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YXJnZXQubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgdGFyZ2V0LnB1c2goLi4ubWVyZ2VkKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9iamVjdCAmJiBzb3VyY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXM8b2JqZWN0Pihzb3VyY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2tdICYmICh2LmNvbnN0cnVjdG9yID09PSBPYmplY3QgfHwgdi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNzaWduQ29uZmlnKHRhcmdldFtrXSwgdik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtrXSA9IHY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRQbHVnaW4obW9kdWxlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKGAke21vZHVsZX0vZXNuZXh0LXNlcnZlci5wbHVnaW5gKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgbG9nLmVycm9yKFwicGx1Z2luXCIsIG1vZHVsZSwgXCJsb2FkIGZhaWxlZFwiLCBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gbG9hZCBwbHVnaW4gJyR7bW9kdWxlfScgZnJvbSAnJHtwcm9jZXNzLmN3ZCgpfSdgKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc3RhdERpcmVjdG9yeShwYXRobmFtZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gZnMuc3RhdFN5bmMocGF0aG5hbWUpO1xyXG4gICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRU5PRU5UOiBubyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5ICcke3BhdGhuYW1lfSdgKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdG9yeShuYW1lKSB7XHJcbiAgICBjb25zdCBwYXRobmFtZSA9IHBhdGgucmVzb2x2ZShuYW1lKTtcclxuICAgIGlmICghc3RhdERpcmVjdG9yeShwYXRobmFtZSkuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRU5PRElSOiBub3QgYSBkaXJlY3RvcnkgJyR7cGF0aG5hbWV9J2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGhuYW1lO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdE9wdGlvbnMoYXJnczogQXJncyk6IEVTTmV4dE9wdGlvbnMge1xyXG5cclxuICAgIGNvbnN0IGJhc2VEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpO1xyXG4gICAgY29uc3Qgcm9vdERpciA9IGFyZ3Mucm9vdCA/IHJlc29sdmVEaXJlY3RvcnkoYXJncy5yb290KSA6IHByb2Nlc3MuY3dkKCk7XHJcblxyXG4gICAgY29uc3QgcmVhZFRleHRGaWxlU3luYyA9IChmaWxlbmFtZSkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcclxuICAgICAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKGJhc2VEaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHtcclxuICAgICAgICByb290RGlyLFxyXG4gICAgICAgIGxvZzoge1xyXG4gICAgICAgICAgICBsZXZlbDogXCJpbmZvXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGh0dHAyOiBcInB1c2hcIixcclxuICAgICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAgICAgcHJvdG9jb2w6IFwiaHR0cHNcIixcclxuICAgICAgICAgICAgaG9zdDogXCJsb2NhbGhvc3RcIixcclxuICAgICAgICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgZ2V0IGtleSgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmtleVwiKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBnZXQgY2VydCgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmNydFwiKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhbGxvd0hUVFAxOiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc291cmNlczogcGF0aC5yZXNvbHZlKGJhc2VEaXIsIFwicmVzb3VyY2VzXCIpLFxyXG4gICAgICAgIHdhdGNoZXI6IHtcclxuICAgICAgICAgICAgY3dkOiByb290RGlyLFxyXG4gICAgICAgICAgICBhdG9taWM6IGZhbHNlLFxyXG4gICAgICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgICAgICBcIm5vZGVfbW9kdWxlcy8qKlwiLFxyXG4gICAgICAgICAgICAgICAgXCJ3ZWJfbW9kdWxlcy8qKlwiXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJvdXRlcjoge1xyXG4gICAgICAgICAgICBpZ25vcmVUcmFpbGluZ1NsYXNoOiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd1Vuc2FmZVJlZ2V4OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtaWRkbGV3YXJlOiBbXSxcclxuICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICBcIi9hcGlcIjoge3RhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjkwMDBcIn1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvcnM6IHtcclxuICAgICAgICAgICAgb3JpZ2luOiBcIipcIixcclxuICAgICAgICAgICAgbWV0aG9kczogXCJHRVQsIEhFQUQsIFBVVCwgUE9TVCwgREVMRVRFLCBQQVRDSFwiLFxyXG4gICAgICAgICAgICBhbGxvd2VkSGVhZGVyczogXCJYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIENvbnRlbnQtVHlwZVwiLFxyXG4gICAgICAgICAgICBjcmVkZW50aWFsczogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgZGVmbGF0ZTogdHJ1ZSxcclxuICAgICAgICBldGFnOiB7XHJcbiAgICAgICAgICAgIHdlYWs6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtb3VudDoge1xyXG4gICAgICAgICAgICBcIi9cIjogcm9vdERpclxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmFiZWw6IHtcclxuICAgICAgICAgICAgYmFiZWxyYzogdHJ1ZSxcclxuICAgICAgICAgICAgY2FsbGVyOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImVzbmV4dC1zZXJ2ZXJcIixcclxuICAgICAgICAgICAgICAgIHN1cHBvcnRzU3RhdGljRVNNOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNvdXJjZVR5cGU6IFwibW9kdWxlXCIsXHJcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tc3ludGF4LWltcG9ydC1tZXRhXCJdLFxyXG4gICAgICAgICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb3JlanNcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJoZWxwZXJzXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdlbmVyYXRvclwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBcInVzZUVTTW9kdWxlc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYWJzb2x1dGVSdW50aW1lXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidmVyc2lvblwiOiBcIjcuMTAuNVwiXHJcbiAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzYXNzOiB7XHJcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtcIi5zY3NzXCIsIFwiLmNzc1wiLCBcIi5zYXNzXCJdLFxyXG4gICAgICAgICAgICBvdXRwdXRTdHlsZTogXCJleHBhbmRlZFwiXHJcbiAgICAgICAgfVxyXG4gICAgfSwgcmVxdWlyZShcImVzbmV4dC13ZWItbW9kdWxlcy93ZWItbW9kdWxlcy5jb25maWcuanNcIikpO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBBcmdzID0ge1xyXG4gICAgY29uZmlnPzogc3RyaW5nXHJcbiAgICByb290Pzogc3RyaW5nXHJcbiAgICBtb2R1bGU/OiBzdHJpbmcgfCBzdHJpbmdbXVxyXG4gICAgZGVidWc/OiBib29sZWFuXHJcbiAgICBwcm9kdWN0aW9uPzogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKGFyZ3M6IEFyZ3MgPSB7fSwgb3ZlcnJpZGU/KTogUmVhZG9ubHk8RVNOZXh0T3B0aW9ucz4ge1xyXG5cclxuICAgIGxldCBvcHRpb25zOiBFU05leHRPcHRpb25zID0gZGVmYXVsdE9wdGlvbnMoYXJncyk7XHJcblxyXG4gICAgaWYgKGFyZ3MuY29uZmlnKSB7XHJcbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcoYXJncy5jb25maWcpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3Qgcm9vdENvbmZpZyA9IHJlc29sdmVDb25maWcocGF0aC5qb2luKG9wdGlvbnMucm9vdERpciwgXCJlc25leHQtc2VydmVyLmNvbmZpZ1wiKSk7XHJcbiAgICAgICAgY29uc3QgbG9jYWxDb25maWcgPSByZXNvbHZlQ29uZmlnKFwiZXNuZXh0LXNlcnZlci5jb25maWdcIik7XHJcbiAgICAgICAgaWYgKHJvb3RDb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKGxvY2FsQ29uZmlnICE9PSByb290Q29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgbG9hZENvbmZpZyhyb290Q29uZmlnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoYG5vIGNvbmZpZyBmb3VuZCBpbiAnJHtvcHRpb25zLnJvb3REaXJ9J2ApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobG9jYWxDb25maWcpIHtcclxuICAgICAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcobG9jYWxDb25maWcpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoYG5vIGNvbmZpZyBmb3VuZCBpbiAnJHtwcm9jZXNzLmN3ZCgpfSdgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIG92ZXJyaWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJncy5tb2R1bGUpIHtcclxuICAgICAgICBjb25zdCBtb2R1bGVzID0gQXJyYXkuaXNBcnJheShhcmdzLm1vZHVsZSkgPyBhcmdzLm1vZHVsZSA6IFthcmdzLm1vZHVsZV07XHJcbiAgICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbW9kdWxlcykge1xyXG4gICAgICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgbG9hZFBsdWdpbihtb2R1bGUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubG9nKSB7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihsb2csIG9wdGlvbnMubG9nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJncy5kZWJ1Zykge1xyXG4gICAgICAgIGxvZy5sZXZlbCA9IFwiZGVidWdcIjtcclxuICAgIH1cclxuXHJcbiAgICBsb2cuZGVidWcoXCJjb25maWd1cmVkOlwiLCBvcHRpb25zKTtcclxuXHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxufVxyXG4iXX0=