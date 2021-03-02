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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbmZpZ3VyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSw0Q0FBb0I7QUFHcEIsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQXVDbkMsU0FBUyxVQUFVLENBQUMsUUFBZ0I7SUFDaEMsSUFBSTtRQUNBLE9BQU8sT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUMxQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsUUFBUSxXQUFXLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUNwRztBQUNMLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUFnQjtJQUNuQyxJQUFJO1FBQ0EsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRDtJQUFDLE9BQU8sT0FBTyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNMLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxNQUFTLEVBQUUsTUFBVztJQUMzQyxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxJQUFJLE1BQU0sWUFBWSxLQUFLLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUNELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFN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LENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RSxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU87WUFBRSxJQUFJO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSx1QkFBdUIsRUFBRSxFQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBQzdGLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDMUM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWiwwQkFBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ25CO0tBQ0o7SUFFRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLENBQUMsTUFBTSxDQUFDLDBCQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ25DO0lBRUQsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1osMEJBQUcsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0tBQ3ZCO0lBRUQsMEJBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWxDLE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUM7QUFqREQsOEJBaURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcmFuc2Zvcm1PcHRpb25zfSBmcm9tIFwiQGJhYmVsL2NvcmVcIjtcclxuaW1wb3J0IHtGU1dhdGNoZXIsIFdhdGNoT3B0aW9uc30gZnJvbSBcImNob2tpZGFyXCI7XHJcbmltcG9ydCB7Q29yc09wdGlvbnN9IGZyb20gXCJjb3JzXCI7XHJcbmltcG9ydCB7V2ViTW9kdWxlc09wdGlvbnN9IGZyb20gXCJlc25leHQtd2ViLW1vZHVsZXNcIjtcclxuaW1wb3J0IHtPcHRpb25zfSBmcm9tIFwiZXRhZ1wiO1xyXG5pbXBvcnQgUm91dGVyLCB7SFRUUFZlcnNpb259IGZyb20gXCJmaW5kLW15LXdheVwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCBTZXJ2ZXIgZnJvbSBcImh0dHAtcHJveHlcIjtcclxuaW1wb3J0IHtTeW5jT3B0aW9uc30gZnJvbSBcIm5vZGUtc2Fzc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcbmltcG9ydCB7U2VydmVyT3B0aW9uc30gZnJvbSBcIi4vc2VydmVyXCI7XHJcbmltcG9ydCB7TWVzc2FnaW5nT3B0aW9uc30gZnJvbSBcIi4vbWVzc2FnaW5nXCI7XHJcblxyXG5leHBvcnQgdHlwZSBGaW5kTXlXYXlNaWRkbGV3YXJlID0gKFxyXG4gICAgcm91dGVyOiBSb3V0ZXIuSW5zdGFuY2U8SFRUUFZlcnNpb24uVjEgfCBIVFRQVmVyc2lvbi5WMj4sXHJcbiAgICBvcHRpb25zOiBFU05leHRPcHRpb25zLFxyXG4gICAgd2F0Y2hlcjogRlNXYXRjaGVyXHJcbikgPT4gdm9pZDtcclxuXHJcbmV4cG9ydCB0eXBlIEVTTmV4dE9wdGlvbnMgPSBXZWJNb2R1bGVzT3B0aW9ucyAmIHtcclxuICAgIHJvb3REaXI6IHN0cmluZ1xyXG4gICAgbG9nPzoge1xyXG4gICAgICAgIGxldmVsOiBcInRyYWNlXCIgfCBcImRlYnVnXCIgfCBcImluZm9cIiB8IFwid2FyblwiIHwgXCJlcnJvclwiIHwgXCJub3RoaW5nXCJcclxuICAgICAgICBkZXRhaWxzPzogYm9vbGVhblxyXG4gICAgICAgIGNvbXBhY3Q/OiBib29sZWFuXHJcbiAgICB9XHJcbiAgICBodHRwMj86IFwicHVzaFwiIHwgXCJwcmVsb2FkXCIgfCBmYWxzZVxyXG4gICAgc2VydmVyPzogU2VydmVyT3B0aW9uc1xyXG4gICAgcmVzb3VyY2VzOiBzdHJpbmdcclxuICAgIHdhdGNoZXI/OiBXYXRjaE9wdGlvbnNcclxuICAgIHJvdXRlcjogUm91dGVyLkNvbmZpZzxIVFRQVmVyc2lvbi5WMSB8IEhUVFBWZXJzaW9uLlYyPlxyXG4gICAgbWlkZGxld2FyZTogRmluZE15V2F5TWlkZGxld2FyZVtdXHJcbiAgICBwcm94eTogeyBbcGF0aDogc3RyaW5nXTogU2VydmVyLlNlcnZlck9wdGlvbnMgfVxyXG4gICAgY29yczogQ29yc09wdGlvbnNcclxuICAgIGV0YWc6IE9wdGlvbnNcclxuICAgIGNhY2hlPzogYm9vbGVhblxyXG4gICAgZW5jb2Rpbmc6IFwiZ3ppcFwiIHwgXCJicm90bGlcIiB8IFwiYnJcIiB8IFwiZGVmbGF0ZVwiIHwgXCJkZWZsYXRlLXJhd1wiIHwgdW5kZWZpbmVkXHJcbiAgICB0cmFuc2Zvcm06IHtcclxuICAgICAgICBpbmNsdWRlOiBzdHJpbmcgfCBzdHJpbmdbXVxyXG4gICAgICAgIGV4Y2x1ZGU6IHN0cmluZyB8IHN0cmluZ1tdXHJcbiAgICAgICAgcHJlUHJvY2Vzcz8oZmlsZW5hbWU6IHN0cmluZywgY29kZTogc3RyaW5nKTogc3RyaW5nXHJcbiAgICB9XHJcbiAgICBtb3VudDogeyBbcGF0aDogc3RyaW5nXTogc3RyaW5nIH1cclxuICAgIGJhYmVsOiBUcmFuc2Zvcm1PcHRpb25zXHJcbiAgICBzYXNzOiBTeW5jT3B0aW9uc1xyXG4gICAgbWVzc2FnaW5nPzogTWVzc2FnaW5nT3B0aW9uc1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkQ29uZmlnKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZShwYXRoLnJlc29sdmUocGF0aG5hbWUpKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gbG9hZCBjb25maWcgJyR7cGF0aG5hbWV9JyBmcm9tICcke3Byb2Nlc3MuY3dkKCl9JywgJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNvbHZlQ29uZmlnKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShwYXRoLnJlc29sdmUocGF0aG5hbWUpKTtcclxuICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYXNzaWduQ29uZmlnPFY+KHRhcmdldDogViwgc291cmNlOiBhbnkpIHtcclxuICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBzb3VyY2UgIT09IG51bGwpIHtcclxuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgQXJyYXkgJiYgc291cmNlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gbmV3IFNldCh0YXJnZXQpO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBtZXJnZWQuYWRkKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRhcmdldC5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICB0YXJnZXQucHVzaCguLi5tZXJnZWQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgT2JqZWN0ICYmIHNvdXJjZSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllczxvYmplY3Q+KHNvdXJjZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRba10gJiYgKHYuY29uc3RydWN0b3IgPT09IE9iamVjdCB8fCB2LmNvbnN0cnVjdG9yID09PSBBcnJheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhc3NpZ25Db25maWcodGFyZ2V0W2tdLCB2KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tdID0gdjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc3RhdERpcmVjdG9yeShwYXRobmFtZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gZnMuc3RhdFN5bmMocGF0aG5hbWUpO1xyXG4gICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRU5PRU5UOiBubyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5ICcke3BhdGhuYW1lfSdgKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdG9yeShuYW1lKSB7XHJcbiAgICBjb25zdCBwYXRobmFtZSA9IHBhdGgucmVzb2x2ZShuYW1lKTtcclxuICAgIGlmICghc3RhdERpcmVjdG9yeShwYXRobmFtZSkuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRU5PRElSOiBub3QgYSBkaXJlY3RvcnkgJyR7cGF0aG5hbWV9J2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGhuYW1lO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdE9wdGlvbnMoYXJnczogQXJncyk6IEVTTmV4dE9wdGlvbnMge1xyXG5cclxuICAgIGNvbnN0IGJhc2VEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpO1xyXG4gICAgY29uc3Qgcm9vdERpciA9IGFyZ3Mucm9vdCA/IHJlc29sdmVEaXJlY3RvcnkoYXJncy5yb290KSA6IHByb2Nlc3MuY3dkKCk7XHJcblxyXG4gICAgY29uc3QgcmVhZFRleHRGaWxlU3luYyA9IChmaWxlbmFtZSkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKHJvb3REaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcclxuICAgICAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKGJhc2VEaXIsIGZpbGVuYW1lKSwgXCJ1dGYtOFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHtcclxuICAgICAgICByb290RGlyLFxyXG4gICAgICAgIGxvZzoge1xyXG4gICAgICAgICAgICBsZXZlbDogXCJpbmZvXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGh0dHAyOiBcInB1c2hcIixcclxuICAgICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAgICAgcHJvdG9jb2w6IFwiaHR0cHNcIixcclxuICAgICAgICAgICAgaG9zdDogXCJsb2NhbGhvc3RcIixcclxuICAgICAgICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgZ2V0IGtleSgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmtleVwiKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBnZXQgY2VydCgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhZFRleHRGaWxlU3luYyhcImNlcnQvbG9jYWxob3N0LmNydFwiKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhbGxvd0hUVFAxOiB0cnVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc291cmNlczogcGF0aC5yZXNvbHZlKGJhc2VEaXIsIFwicmVzb3VyY2VzXCIpLFxyXG4gICAgICAgIHdhdGNoZXI6IHtcclxuICAgICAgICAgICAgY3dkOiByb290RGlyLFxyXG4gICAgICAgICAgICBhdG9taWM6IGZhbHNlLFxyXG4gICAgICAgICAgICBpZ25vcmVkOiBbXHJcbiAgICAgICAgICAgICAgICBcIm5vZGVfbW9kdWxlcy8qKlwiLFxyXG4gICAgICAgICAgICAgICAgXCJ3ZWJfbW9kdWxlcy8qKlwiXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJvdXRlcjoge1xyXG4gICAgICAgICAgICBpZ25vcmVUcmFpbGluZ1NsYXNoOiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd1Vuc2FmZVJlZ2V4OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtaWRkbGV3YXJlOiBbXSxcclxuICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICBcIi9hcGlcIjoge3RhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjkwMDBcIn1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvcnM6IHtcclxuICAgICAgICAgICAgb3JpZ2luOiBcIipcIixcclxuICAgICAgICAgICAgbWV0aG9kczogXCJHRVQsIEhFQUQsIFBVVCwgUE9TVCwgREVMRVRFLCBQQVRDSFwiLFxyXG4gICAgICAgICAgICBhbGxvd2VkSGVhZGVyczogXCJYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIENvbnRlbnQtVHlwZVwiLFxyXG4gICAgICAgICAgICBjcmVkZW50aWFsczogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgZGVmbGF0ZTogdHJ1ZSxcclxuICAgICAgICBldGFnOiB7XHJcbiAgICAgICAgICAgIHdlYWs6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtb3VudDoge1xyXG4gICAgICAgICAgICBcIi9cIjogcm9vdERpclxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmFiZWw6IHtcclxuICAgICAgICAgICAgYmFiZWxyYzogdHJ1ZSxcclxuICAgICAgICAgICAgY2FsbGVyOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImVzbmV4dC1zZXJ2ZXJcIixcclxuICAgICAgICAgICAgICAgIHN1cHBvcnRzU3RhdGljRVNNOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNvdXJjZVR5cGU6IFwibW9kdWxlXCIsXHJcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tc3ludGF4LWltcG9ydC1tZXRhXCJdLFxyXG4gICAgICAgICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcnVudGltZVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjb3JlanNcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJoZWxwZXJzXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZWdlbmVyYXRvclwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBcInVzZUVTTW9kdWxlc1wiOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYWJzb2x1dGVSdW50aW1lXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidmVyc2lvblwiOiBcIjcuMTAuNVwiXHJcbiAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzYXNzOiB7XHJcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtcIi5zY3NzXCIsIFwiLmNzc1wiLCBcIi5zYXNzXCJdLFxyXG4gICAgICAgICAgICBvdXRwdXRTdHlsZTogXCJleHBhbmRlZFwiXHJcbiAgICAgICAgfVxyXG4gICAgfSwgcmVxdWlyZShcImVzbmV4dC13ZWItbW9kdWxlcy93ZWItbW9kdWxlcy5jb25maWcuanNcIikpO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBBcmdzID0ge1xyXG4gICAgY29uZmlnPzogc3RyaW5nXHJcbiAgICByb290Pzogc3RyaW5nXHJcbiAgICBtb2R1bGU/OiBzdHJpbmcgfCBzdHJpbmdbXVxyXG4gICAgZGVidWc/OiBib29sZWFuXHJcbiAgICBwcm9kdWN0aW9uPzogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKGFyZ3M6IEFyZ3MgPSB7fSwgb3ZlcnJpZGU/KTogUmVhZG9ubHk8RVNOZXh0T3B0aW9ucz4ge1xyXG5cclxuICAgIGxldCBvcHRpb25zOiBFU05leHRPcHRpb25zID0gZGVmYXVsdE9wdGlvbnMoYXJncyk7XHJcblxyXG4gICAgaWYgKGFyZ3MuY29uZmlnKSB7XHJcbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcoYXJncy5jb25maWcpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3Qgcm9vdENvbmZpZyA9IHJlc29sdmVDb25maWcocGF0aC5qb2luKG9wdGlvbnMucm9vdERpciwgXCJlc25leHQtc2VydmVyLmNvbmZpZ1wiKSk7XHJcbiAgICAgICAgY29uc3QgbG9jYWxDb25maWcgPSByZXNvbHZlQ29uZmlnKFwiZXNuZXh0LXNlcnZlci5jb25maWdcIik7XHJcbiAgICAgICAgaWYgKHJvb3RDb25maWcpIHtcclxuICAgICAgICAgICAgaWYgKGxvY2FsQ29uZmlnICE9PSByb290Q29uZmlnKSB7XHJcbiAgICAgICAgICAgICAgICBhc3NpZ25Db25maWcob3B0aW9ucywgbG9hZENvbmZpZyhyb290Q29uZmlnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoYG5vIGNvbmZpZyBmb3VuZCBpbiAnJHtvcHRpb25zLnJvb3REaXJ9J2ApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobG9jYWxDb25maWcpIHtcclxuICAgICAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIGxvYWRDb25maWcobG9jYWxDb25maWcpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoYG5vIGNvbmZpZyBmb3VuZCBpbiAnJHtwcm9jZXNzLmN3ZCgpfSdgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgYXNzaWduQ29uZmlnKG9wdGlvbnMsIG92ZXJyaWRlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJncy5tb2R1bGUpIHtcclxuICAgICAgICBjb25zdCBtb2R1bGVzID0gQXJyYXkuaXNBcnJheShhcmdzLm1vZHVsZSkgPyBhcmdzLm1vZHVsZSA6IFthcmdzLm1vZHVsZV07XHJcbiAgICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbW9kdWxlcykgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGx1Z2luID0gcmVxdWlyZS5yZXNvbHZlKGAke21vZHVsZX0vZXNuZXh0LXNlcnZlci5wbHVnaW5gLCB7cGF0aHM6IFtvcHRpb25zLnJvb3REaXJdfSk7XHJcbiAgICAgICAgICAgIGFzc2lnbkNvbmZpZyhvcHRpb25zLCByZXF1aXJlKHBsdWdpbikpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZy5lcnJvcihcInBsdWdpbiAnXCIgKyBtb2R1bGUgKyBcIicgbG9hZCBmYWlsZWQ6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5sb2cpIHtcclxuICAgICAgICBPYmplY3QuYXNzaWduKGxvZywgb3B0aW9ucy5sb2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcmdzLmRlYnVnKSB7XHJcbiAgICAgICAgbG9nLmxldmVsID0gXCJkZWJ1Z1wiO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZy5kZWJ1ZyhcImNvbmZpZ3VyZWQ6XCIsIG9wdGlvbnMpO1xyXG5cclxuICAgIHJldHVybiBvcHRpb25zO1xyXG59XHJcbiJdfQ==