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
    if (args.module) {
        const modules = Array.isArray(args.module) ? args.module : [args.module];
        for (const module of modules)
            try {
                const plugin = require.resolve(`${module}/esnext-server.plugin`, { paths: [options.rootDir] });
                assignConfig(options, require(plugin));
            }
            catch (error) {
                tiny_node_logger_1.default.error("plugin '" + module + "' load failed:", error);
                process.exit(1);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZ3VyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSw0Q0FBb0I7QUFHcEIsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQXVDbkMsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSTtRQUNBLE9BQU8sT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUMxQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxXQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUNwRztBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJO1FBQ0EsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sT0FBTyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxNQUFTLEVBQUUsTUFBVztJQUMzQyxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxJQUFJLE1BQU0sWUFBWSxLQUFLLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFN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LENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RSxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU87WUFBRSxJQUFJO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSx1QkFBdUIsRUFBRSxFQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQzdGLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDMUM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWiwwQkFBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ25CO0tBQ0o7SUFFRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLENBQUMsTUFBTSxDQUFDLDBCQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ25DO0lBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1osMEJBQUcsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0tBQ3ZCO0lBRUQsMEJBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxDLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFqREQsOEJBaURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcbmltcG9ydCB7RlNXYXRjaGVyLCBXYXRjaE9wdGlvbnN9IGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IHtDb3JzT3B0aW9uc30gZnJvbSBcImNvcnNcIjtcbmltcG9ydCB7V2ViTW9kdWxlc09wdGlvbnN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcbmltcG9ydCB7T3B0aW9uc30gZnJvbSBcImV0YWdcIjtcbmltcG9ydCBSb3V0ZXIsIHtIVFRQVmVyc2lvbn0gZnJvbSBcImZpbmQtbXktd2F5XCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgU2VydmVyIGZyb20gXCJodHRwLXByb3h5XCI7XG5pbXBvcnQge1N5bmNPcHRpb25zfSBmcm9tIFwibm9kZS1zYXNzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xuaW1wb3J0IHtTZXJ2ZXJPcHRpb25zfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcbmltcG9ydCB7QmFja2JvbmVPcHRpb25zfSBmcm9tIFwiLi9iYWNrYm9uZVwiO1xuXG5leHBvcnQgdHlwZSBGaW5kTXlXYXlNaWRkbGV3YXJlID0gKFxuICAgIHJvdXRlcjogUm91dGVyLkluc3RhbmNlPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+LFxuICAgIG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsXG4gICAgd2F0Y2hlcjogRlNXYXRjaGVyXG4pID0+IHZvaWQ7XG5cbmV4cG9ydCB0eXBlIEVTTmV4dE9wdGlvbnMgPSBXZWJNb2R1bGVzT3B0aW9ucyAmIHtcbiAgICByb290RGlyOiBzdHJpbmdcbiAgICBsb2c/OiB7XG4gICAgICAgIGxldmVsOiBcInRyYWNlXCIgfCBcImRlYnVnXCIgfCBcImluZm9cIiB8IFwid2FyblwiIHwgXCJlcnJvclwiIHwgXCJub3RoaW5nXCJcbiAgICAgICAgZGV0YWlscz86IGJvb2xlYW5cbiAgICAgICAgY29tcGFjdD86IGJvb2xlYW5cbiAgICB9XG4gICAgaHR0cDI/OiBcInB1c2hcIiB8IFwicHJlbG9hZFwiIHwgZmFsc2VcbiAgICBzZXJ2ZXI/OiBTZXJ2ZXJPcHRpb25zXG4gICAgcmVzb3VyY2VzOiBzdHJpbmdcbiAgICB3YXRjaGVyPzogV2F0Y2hPcHRpb25zXG4gICAgcm91dGVyOiBSb3V0ZXIuQ29uZmlnPEhUVFBWZXJzaW9uLlYxIHwgSFRUUFZlcnNpb24uVjI+XG4gICAgbWlkZGxld2FyZTogRmluZE15V2F5TWlkZGxld2FyZVtdXG4gICAgcHJveHk6IHsgW3BhdGg6IHN0cmluZ106IFNlcnZlci5TZXJ2ZXJPcHRpb25zIH1cbiAgICBjb3JzOiBDb3JzT3B0aW9uc1xuICAgIGV0YWc6IE9wdGlvbnNcbiAgICBjYWNoZT86IGJvb2xlYW5cbiAgICBlbmNvZGluZzogXCJnemlwXCIgfCBcImJyb3RsaVwiIHwgXCJiclwiIHwgXCJkZWZsYXRlXCIgfCBcImRlZmxhdGUtcmF3XCIgfCB1bmRlZmluZWRcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgICAgaW5jbHVkZTogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgZXhjbHVkZTogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgcHJlUHJvY2Vzcz8oZmlsZW5hbWU6IHN0cmluZywgY29kZTogc3RyaW5nKTogc3RyaW5nXG4gICAgfVxuICAgIG1vdW50OiB7IFtwYXRoOiBzdHJpbmddOiBzdHJpbmcgfVxuICAgIGJhYmVsOiBUcmFuc2Zvcm1PcHRpb25zXG4gICAgc2FzczogU3luY09wdGlvbnNcbiAgICBiYWNrYm9uZT86IEJhY2tib25lT3B0aW9uc1xufVxuXG5mdW5jdGlvbiBsb2FkQ29uZmlnKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKHBhdGgucmVzb2x2ZShwYXRobmFtZSkpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGxvYWQgY29uZmlnICcke3BhdGhuYW1lfScgZnJvbSAnJHtwcm9jZXNzLmN3ZCgpfScsICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDb25maWcocGF0aG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUocGF0aC5yZXNvbHZlKHBhdGhuYW1lKSk7XG4gICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFzc2lnbkNvbmZpZzxWPih0YXJnZXQ6IFYsIHNvdXJjZTogYW55KSB7XG4gICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgQXJyYXkgJiYgc291cmNlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IG5ldyBTZXQodGFyZ2V0KTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWQuYWRkKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFyZ2V0Lmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB0YXJnZXQucHVzaCguLi5tZXJnZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE9iamVjdCAmJiBzb3VyY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzPG9iamVjdD4oc291cmNlKSkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRba10gJiYgKHYuY29uc3RydWN0b3IgPT09IE9iamVjdCB8fCB2LmNvbnN0cnVjdG9yID09PSBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzaWduQ29uZmlnKHRhcmdldFtrXSwgdik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tdID0gdjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXREaXJlY3RvcnkocGF0aG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnMuc3RhdFN5bmMocGF0aG5hbWUpO1xuICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFTk9FTlQ6IG5vIHN1Y2ggZmlsZSBvciBkaXJlY3RvcnkgJyR7cGF0aG5hbWV9J2ApO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdG9yeShuYW1lKSB7XG4gICAgY29uc3QgcGF0aG5hbWUgPSBwYXRoLnJlc29sdmUobmFtZSk7XG4gICAgaWYgKCFzdGF0RGlyZWN0b3J5KHBhdGhuYW1lKS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRU5PRElSOiBub3QgYSBkaXJlY3RvcnkgJyR7cGF0aG5hbWV9J2ApO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0T3B0aW9ucyhhcmdzOiBBcmdzKTogRVNOZXh0T3B0aW9ucyB7XG5cbiAgICBjb25zdCBiYXNlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTtcbiAgICBjb25zdCByb290RGlyID0gYXJncy5yb290ID8gcmVzb2x2ZURpcmVjdG9yeShhcmdzLnJvb3QpIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIGNvbnN0IHJlYWRUZXh0RmlsZVN5bmMgPSAoZmlsZW5hbWUpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoYmFzZURpciwgZmlsZW5hbWUpLCBcInV0Zi04XCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgcm9vdERpcixcbiAgICAgICAgbG9nOiB7XG4gICAgICAgICAgICBsZXZlbDogXCJpbmZvXCJcbiAgICAgICAgfSxcbiAgICAgICAgaHR0cDI6IFwicHVzaFwiLFxuICAgICAgICBzZXJ2ZXI6IHtcbiAgICAgICAgICAgIHByb3RvY29sOiBcImh0dHBzXCIsXG4gICAgICAgICAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBnZXQga2V5KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmtleVwiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldCBjZXJ0KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmNydFwiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFsbG93SFRUUDE6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzb3VyY2VzOiBwYXRoLnJlc29sdmUoYmFzZURpciwgXCJyZXNvdXJjZXNcIiksXG4gICAgICAgIHdhdGNoZXI6IHtcbiAgICAgICAgICAgIGN3ZDogcm9vdERpcixcbiAgICAgICAgICAgIGF0b21pYzogZmFsc2UsXG4gICAgICAgICAgICBpZ25vcmVkOiBbXG4gICAgICAgICAgICAgICAgXCJub2RlX21vZHVsZXMvKipcIixcbiAgICAgICAgICAgICAgICBcIndlYl9tb2R1bGVzLyoqXCJcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgcm91dGVyOiB7XG4gICAgICAgICAgICBpZ25vcmVUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgYWxsb3dVbnNhZmVSZWdleDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBtaWRkbGV3YXJlOiBbXSxcbiAgICAgICAgcHJveHk6IHtcbiAgICAgICAgICAgIFwiL2FwaVwiOiB7dGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6OTAwMFwifVxuICAgICAgICB9LFxuICAgICAgICBjb3JzOiB7XG4gICAgICAgICAgICBvcmlnaW46IFwiKlwiLFxuICAgICAgICAgICAgbWV0aG9kczogXCJHRVQsIEhFQUQsIFBVVCwgUE9TVCwgREVMRVRFLCBQQVRDSFwiLFxuICAgICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFwiWC1SZXF1ZXN0ZWQtV2l0aCwgQWNjZXB0LCBDb250ZW50LVR5cGVcIixcbiAgICAgICAgICAgIGNyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGNhY2hlOiB0cnVlLFxuICAgICAgICBkZWZsYXRlOiB0cnVlLFxuICAgICAgICBldGFnOiB7XG4gICAgICAgICAgICB3ZWFrOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBtb3VudDoge1xuICAgICAgICAgICAgXCIvXCI6IHJvb3REaXJcbiAgICAgICAgfSxcbiAgICAgICAgYmFiZWw6IHtcbiAgICAgICAgICAgIGJhYmVscmM6IHRydWUsXG4gICAgICAgICAgICBjYWxsZXI6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcImVzbmV4dC1zZXJ2ZXJcIixcbiAgICAgICAgICAgICAgICBzdXBwb3J0c1N0YXRpY0VTTTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNvdXJjZVR5cGU6IFwibW9kdWxlXCIsXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiB0cnVlLFxuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tc3ludGF4LWltcG9ydC1tZXRhXCJdLFxuICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLXJ1bnRpbWVcIiwge1xuICAgICAgICAgICAgICAgICAgICBcImNvcmVqc1wiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJoZWxwZXJzXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIFwicmVnZW5lcmF0b3JcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwidXNlRVNNb2R1bGVzXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIFwiYWJzb2x1dGVSdW50aW1lXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcInZlcnNpb25cIjogXCI3LjEwLjVcIlxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHNhc3M6IHtcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtcIi5zY3NzXCIsIFwiLmNzc1wiLCBcIi5zYXNzXCJdLFxuICAgICAgICAgICAgb3V0cHV0U3R5bGU6IFwiZXhwYW5kZWRcIlxuICAgICAgICB9XG4gICAgfSwgcmVxdWlyZShcImVzbmV4dC13ZWItbW9kdWxlcy93ZWItbW9kdWxlcy5jb25maWcuanNcIikpO1xufVxuXG5leHBvcnQgdHlwZSBBcmdzID0ge1xuICAgIGNvbmZpZz86IHN0cmluZ1xuICAgIHJvb3Q/OiBzdHJpbmdcbiAgICBtb2R1bGU/OiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgIGRlYnVnPzogYm9vbGVhblxuICAgIHByb2R1Y3Rpb24/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUoYXJnczogQXJncyA9IHt9LCBvdmVycmlkZT8pOiBSZWFkb25seTxFU05leHRPcHRpb25zPiB7XG5cbiAgICBsZXQgb3B0aW9uczogRVNOZXh0T3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zKGFyZ3MpO1xuXG4gICAgaWYgKGFyZ3MuY29uZmlnKSB7XG4gICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBsb2FkQ29uZmlnKGFyZ3MuY29uZmlnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgcm9vdENvbmZpZyA9IHJlc29sdmVDb25maWcocGF0aC5qb2luKG9wdGlvbnMucm9vdERpciwgXCJlc25leHQtc2VydmVyLmNvbmZpZ1wiKSk7XG4gICAgICAgIGNvbnN0IGxvY2FsQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhcImVzbmV4dC1zZXJ2ZXIuY29uZmlnXCIpO1xuICAgICAgICBpZiAocm9vdENvbmZpZykge1xuICAgICAgICAgICAgaWYgKGxvY2FsQ29uZmlnICE9PSByb290Q29uZmlnKSB7XG4gICAgICAgICAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcocm9vdENvbmZpZykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nLmRlYnVnKGBubyBjb25maWcgZm91bmQgaW4gJyR7b3B0aW9ucy5yb290RGlyfSdgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9jYWxDb25maWcpIHtcbiAgICAgICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCBsb2FkQ29uZmlnKGxvY2FsQ29uZmlnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2cuZGVidWcoYG5vIGNvbmZpZyBmb3VuZCBpbiAnJHtwcm9jZXNzLmN3ZCgpfSdgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgb3ZlcnJpZGUpO1xuICAgIH1cblxuICAgIGlmIChhcmdzLm1vZHVsZSkge1xuICAgICAgICBjb25zdCBtb2R1bGVzID0gQXJyYXkuaXNBcnJheShhcmdzLm1vZHVsZSkgPyBhcmdzLm1vZHVsZSA6IFthcmdzLm1vZHVsZV07XG4gICAgICAgIGZvciAoY29uc3QgbW9kdWxlIG9mIG1vZHVsZXMpIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwbHVnaW4gPSByZXF1aXJlLnJlc29sdmUoYCR7bW9kdWxlfS9lc25leHQtc2VydmVyLnBsdWdpbmAsIHtwYXRoczogW29wdGlvbnMucm9vdERpcl19KTtcbiAgICAgICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCByZXF1aXJlKHBsdWdpbikpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nLmVycm9yKFwicGx1Z2luICdcIiArIG1vZHVsZSArIFwiJyBsb2FkIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMubG9nKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24obG9nLCBvcHRpb25zLmxvZyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MuZGVidWcpIHtcbiAgICAgICAgbG9nLmxldmVsID0gXCJkZWJ1Z1wiO1xuICAgIH1cblxuICAgIGxvZy5kZWJ1ZyhcImNvbmZpZ3VyZWQ6XCIsIG9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIG9wdGlvbnM7XG59XG4iXX0=