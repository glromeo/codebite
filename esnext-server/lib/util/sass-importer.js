"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassImporter = void 0;
const core_1 = __importDefault(require("@babel/core"));
const fs_1 = __importDefault(require("fs"));
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const EXTENSIONS = new Set([".scss", ".sass", ".css"]);
const PATHS = [];
exports.useSassImporter = nano_memoize_1.default(config => {
    const realpathSyncImpl = typeof fs_1.default.realpathSync.native === "function" ? fs_1.default.realpathSync.native : fs_1.default.realpathSync;
    function realpathSync(x) {
        try {
            return realpathSyncImpl(x);
        }
        catch (realpathErr) {
            if (realpathErr.code !== "ENOENT")
                throw realpathErr;
        }
        return x;
    }
    function isFile(file) {
        try {
            const stat = fs_1.default.statSync(file);
            return stat.isFile() || stat.isFIFO();
        }
        catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR"))
                return false;
            throw e;
        }
    }
    function isDirectory(dir) {
        try {
            const stat = fs_1.default.statSync(dir);
            return stat.isDirectory();
        }
        catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR"))
                return false;
            throw e;
        }
    }
    function flatMap(obj) {
        const result = [];
        Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            if (typeof value === "string") {
                result.push([key, value]);
            }
            else {
                const cssText = value.cssText;
                if (cssText) {
                    result.push([key, cssText]);
                }
                else {
                    for (const [k, v] of flatMap(value)) {
                        result.push([`${key}-${k}`, v]);
                    }
                }
            }
        });
        return result;
    }
    class IIFE {
        constructor(mocks = null) {
            Object.assign(this, IIFE.MOCK_MODULES, mocks);
        }
        import(pathname) {
            const source = fs_1.default.readFileSync(pathname, "utf-8");
            const out = core_1.default.transformSync(source, IIFE.BABEL_OPTIONS);
            if (out === null || out === void 0 ? void 0 : out.code) {
                eval(out.code);
            }
            return this.default;
        }
    }
    IIFE.MOCK_MODULES = {
        litElement: {
            css: (strings, ...values) => ({
                cssText: values.reduce((acc, v, idx) => acc + v + strings[idx + 1], strings[0])
            })
        }
    };
    IIFE.BABEL_OPTIONS = {
        plugins: [require("./sass-babel-plugin-iife")]
    };
    const nodeModulesPaths = require("resolve/lib/node-modules-paths");
    class Resolver {
        constructor(options) {
            var _a, _b, _c;
            this.basedir = (_a = options === null || options === void 0 ? void 0 : options.basedir) !== null && _a !== void 0 ? _a : process.cwd();
            this.filename = (_b = options === null || options === void 0 ? void 0 : options.filename) !== null && _b !== void 0 ? _b : "stdin";
            this.extensions = (options === null || options === void 0 ? void 0 : options.extensions) ? new Set(options.extensions) : EXTENSIONS;
            this.paths = (_c = options === null || options === void 0 ? void 0 : options.paths) !== null && _c !== void 0 ? _c : PATHS;
        }
        resolve(url) {
            const parent = this.filename !== "stdin" ? this.filename : this.basedir;
            const root = realpathSync(path_1.default.resolve(this.basedir));
            let m;
            if (url.startsWith("~")) {
                m = this.loadNodeModulesSync(url.substring(1), root);
            }
            else {
                var res = path_1.default.resolve(root, url);
                if (url === "." || url === ".." || url.slice(-1) === "/") {
                    res += "/";
                }
                m = this.loadAsFileSync(res) || this.loadAsDirectorySync(res) || this.loadNodeModulesSync(url, root);
            }
            if (m) {
                return realpathSync(m);
            }
            // else {
            //     var err = new Error("Cannot find module '" + url + "' from '" + parent + "'");
            //     err.code = "MODULE_NOT_FOUND";
            //     throw err;
            // }
        }
        loadAsFileSync(pathname) {
            if (isFile(pathname))
                return pathname;
            const e = pathname.lastIndexOf(path_1.default.sep) + 1;
            const f = `${pathname.slice(0, e)}_${pathname.slice(e)}`;
            if (isFile(f))
                return f;
            let file;
            for (const ext of this.extensions) {
                file = pathname + ext;
                if (isFile(file))
                    return file;
                file = f + ext;
                if (isFile(file))
                    return file;
            }
        }
        loadAsDirectorySync(pathname) {
            const pkgfile = path_1.default.join(isDirectory(pathname) ? realpathSync(pathname) : pathname, "/package.json");
            if (isFile(pkgfile)) {
                try {
                    var pkg = JSON.parse(fs_1.default.readFileSync(pkgfile, "utf-8"));
                }
                catch (ignored) {
                }
                if (pkg) {
                    let main = pkg.sass || pkg.style || pkg.main;
                    if (typeof main !== "string") {
                        const mainError = new TypeError("package “" + pkg.name + "” `sass, style or main` is not a string");
                        mainError["code"] = "INVALID_PACKAGE_MAIN";
                        throw mainError;
                    }
                    if (main === "." || main === "./") {
                        main = "index";
                    }
                    try {
                        const m = this.loadAsFileSync(path_1.default.resolve(pathname, main));
                        if (m)
                            return m;
                        const n = this.loadAsDirectorySync(path_1.default.resolve(pathname, main));
                        if (n)
                            return n;
                    }
                    catch (e) {
                    }
                }
            }
            return this.loadAsFileSync(path_1.default.join(pathname, "/styles.scss"));
        }
        loadNodeModulesSync(url, start) {
            for (let dir of nodeModulesPaths(start, this, url)) {
                dir = path_1.default.join(dir, url);
                if (isDirectory(path_1.default.dirname(dir))) {
                    if (isDirectory(dir)) {
                        return this.loadAsDirectorySync(dir);
                    }
                    else {
                        return this.loadAsFileSync(dir);
                    }
                }
            }
        }
    }
    function sassImporter(basefile) {
        return function (url, file) {
            const filename = file === "stdin" ? basefile : file;
            const basedir = path_1.default.resolve(config.rootDir, path_1.default.dirname(filename));
            const ext = url.substring(url.lastIndexOf("."));
            if (ext !== url && !EXTENSIONS.has(ext)) {
                const resolver = new Resolver({
                    basedir,
                    filename: file,
                    extensions: [ext]
                });
                const resolved = resolver.resolve(url);
                if (resolved) {
                    let obj;
                    if (ext === ".json") {
                        obj = require(resolved);
                    }
                    else if (ext === ".js") {
                        obj = new IIFE().import(resolved);
                    }
                    const variables = flatMap(obj).map(([key, value]) => `$${key}: ${value};`).join("\n");
                    return { contents: variables };
                }
                else {
                    tiny_node_logger_1.default.error("cannot resolve sass import:", url);
                    return null;
                }
            }
            else {
                const resolver = new Resolver({
                    basedir,
                    filename: file
                });
                const resolved = resolver.resolve(url);
                if (resolved) {
                    const ext = resolved.substring(resolved.lastIndexOf("."));
                    if (".css" === ext) {
                        return { contents: fs_1.default.readFileSync(resolved, "utf-8") };
                    }
                    else {
                        return { file: resolved };
                    }
                }
                else {
                    tiny_node_logger_1.default.error("cannot resolve sass import:", url);
                    return null;
                }
            }
        };
    }
    return { sassImporter };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1pbXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtaW1wb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdURBQWdDO0FBQ2hDLDRDQUFvQjtBQUNwQixnRUFBb0M7QUFFcEMsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQUVuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN2RCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7QUFFSixRQUFBLGVBQWUsR0FBRyxzQkFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRTdDLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxZQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFFLENBQUMsWUFBWSxDQUFDO0lBRWpILFNBQVMsWUFBWSxDQUFDLENBQUM7UUFDbkIsSUFBSTtZQUNBLE9BQU8sZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDOUI7UUFBQyxPQUFPLFdBQVcsRUFBRTtZQUNsQixJQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssUUFBUTtnQkFBRSxNQUFNLFdBQVcsQ0FBQztTQUN4RDtRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsTUFBTSxDQUFDLElBQUk7UUFDaEIsSUFBSTtZQUNBLE1BQU0sSUFBSSxHQUFHLFlBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ3pDO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJ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QUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUM5QyxPQUFPLElBQUksQ0FBQztpQkFDZjthQUNKO2lCQUFNO2dCQUNILE1BQU0sUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDO29CQUMxQixPQUFPO29CQUNQLFFBQVEsRUFBRSxJQUFJO2lCQUNqQixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxRQUFRLEVBQUU7b0JBQ1YsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzFELElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRTt3QkFDaEIsT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBQyxDQUFDO3FCQUN6RDt5QkFBTTt3QkFDSCxPQUFPLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDO3FCQUMzQjtpQkFDSjtxQkFBTTtvQkFDSCwwQkFBRyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDOUMsT0FBTyxJQUFJLENBQUM7aUJBQ2Y7YUFDSjtRQUNMLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPLEVBQUMsWUFBWSxFQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmFiZWwgZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHtJbXBvcnRlclJldHVyblR5cGUsIFN5bmNDb250ZXh0LCBTeW5jSW1wb3J0ZXJ9IGZyb20gXCJub2RlLXNhc3NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5cclxuY29uc3QgRVhURU5TSU9OUyA9IG5ldyBTZXQoW1wiLnNjc3NcIiwgXCIuc2Fzc1wiLCBcIi5jc3NcIl0pO1xyXG5jb25zdCBQQVRIUyA9IFtdO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZVNhc3NJbXBvcnRlciA9IG1lbW9pemVkKGNvbmZpZyA9PiB7XHJcblxyXG4gICAgY29uc3QgcmVhbHBhdGhTeW5jSW1wbCA9IHR5cGVvZiBmcy5yZWFscGF0aFN5bmMubmF0aXZlID09PSBcImZ1bmN0aW9uXCIgPyBmcy5yZWFscGF0aFN5bmMubmF0aXZlIDogZnMucmVhbHBhdGhTeW5jO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlYWxwYXRoU3luYyh4KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlYWxwYXRoU3luY0ltcGwoeCk7XHJcbiAgICAgICAgfSBjYXRjaCAocmVhbHBhdGhFcnIpIHtcclxuICAgICAgICAgICAgaWYgKHJlYWxwYXRoRXJyLmNvZGUgIT09IFwiRU5PRU5UXCIpIHRocm93IHJlYWxwYXRoRXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0ZpbGUoZmlsZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhmaWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXQuaXNGaWxlKCkgfHwgc3RhdC5pc0ZJRk8oKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlICYmIChlLmNvZGUgPT09IFwiRU5PRU5UXCIgfHwgZS5jb2RlID09PSBcIkVOT1RESVJcIikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNEaXJlY3RvcnkoZGlyKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGRpcik7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0LmlzRGlyZWN0b3J5KCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoZSAmJiAoZS5jb2RlID09PSBcIkVOT0VOVFwiIHx8IGUuY29kZSA9PT0gXCJFTk9URElSXCIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZsYXRNYXAob2JqKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcclxuICAgICAgICBPYmplY3QuZW50cmllczxDU1NSdWxlIHwgc3RyaW5nPihvYmopLmZvckVhY2goZW50cnkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBlbnRyeTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goW2tleSwgdmFsdWVdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNzc1RleHQgPSB2YWx1ZS5jc3NUZXh0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGNzc1RleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChba2V5LCBjc3NUZXh0XSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIGZsYXRNYXAodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFtgJHtrZXl9LSR7a31gLCB2XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBJSUZFIHtcclxuXHJcbiAgICAgICAgc3RhdGljIE1PQ0tfTU9EVUxFUyA9IHtcclxuICAgICAgICAgICAgbGl0RWxlbWVudDoge1xyXG4gICAgICAgICAgICAgICAgY3NzOiAoc3RyaW5ncywgLi4udmFsdWVzKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNzc1RleHQ6IHZhbHVlcy5yZWR1Y2UoKGFjYywgdiwgaWR4KSA9PiBhY2MgKyB2ICsgc3RyaW5nc1tpZHggKyAxXSwgc3RyaW5nc1swXSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzdGF0aWMgQkFCRUxfT1BUSU9OUyA9IHtcclxuICAgICAgICAgICAgcGx1Z2luczogW3JlcXVpcmUoXCIuL3Nhc3MtYmFiZWwtcGx1Z2luLWlpZmVcIildXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZGVmYXVsdD86IHN0cmluZztcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IobW9ja3MgPSBudWxsKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgSUlGRS5NT0NLX01PRFVMRVMsIG1vY2tzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGltcG9ydChwYXRobmFtZSkge1xyXG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBmcy5yZWFkRmlsZVN5bmMocGF0aG5hbWUsIFwidXRmLThcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IGJhYmVsLnRyYW5zZm9ybVN5bmMoc291cmNlLCBJSUZFLkJBQkVMX09QVElPTlMpO1xyXG4gICAgICAgICAgICBpZiAob3V0Py5jb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBldmFsKG91dC5jb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgY29uc3Qgbm9kZU1vZHVsZXNQYXRocyA9IHJlcXVpcmUoXCJyZXNvbHZlL2xpYi9ub2RlLW1vZHVsZXMtcGF0aHNcIik7XHJcblxyXG4gICAgY2xhc3MgUmVzb2x2ZXIge1xyXG5cclxuICAgICAgICBwcml2YXRlIGJhc2VkaXI6IHN0cmluZztcclxuICAgICAgICBwcml2YXRlIGZpbGVuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgcHJpdmF0ZSBwYXRoczogc3RyaW5nW107XHJcbiAgICAgICAgcHJpdmF0ZSBleHRlbnNpb25zOiBTZXQ8c3RyaW5nPjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3Iob3B0aW9ucz86IHtcclxuICAgICAgICAgICAgYmFzZWRpcjogc3RyaW5nXHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmdcclxuICAgICAgICAgICAgZXh0ZW5zaW9ucz86IHN0cmluZ1tdXHJcbiAgICAgICAgICAgIHBhdGhzPzogc3RyaW5nW11cclxuICAgICAgICB9KSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZWRpciA9IG9wdGlvbnM/LmJhc2VkaXIgPz8gcHJvY2Vzcy5jd2QoKTtcclxuICAgICAgICAgICAgdGhpcy5maWxlbmFtZSA9IG9wdGlvbnM/LmZpbGVuYW1lID8/IFwic3RkaW5cIjtcclxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zID0gb3B0aW9ucz8uZXh0ZW5zaW9ucyA/IG5ldyBTZXQob3B0aW9ucy5leHRlbnNpb25zKSA6IEVYVEVOU0lPTlM7XHJcbiAgICAgICAgICAgIHRoaXMucGF0aHMgPSBvcHRpb25zPy5wYXRocyA/PyBQQVRIUztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc29sdmUodXJsKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmZpbGVuYW1lICE9PSBcInN0ZGluXCIgPyB0aGlzLmZpbGVuYW1lIDogdGhpcy5iYXNlZGlyO1xyXG4gICAgICAgICAgICBjb25zdCByb290ID0gcmVhbHBhdGhTeW5jKHBhdGgucmVzb2x2ZSh0aGlzLmJhc2VkaXIpKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBtO1xyXG4gICAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoXCJ+XCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtID0gdGhpcy5sb2FkTm9kZU1vZHVsZXNTeW5jKHVybC5zdWJzdHJpbmcoMSksIHJvb3QpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IHBhdGgucmVzb2x2ZShyb290LCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHVybCA9PT0gXCIuXCIgfHwgdXJsID09PSBcIi4uXCIgfHwgdXJsLnNsaWNlKC0xKSA9PT0gXCIvXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXMgKz0gXCIvXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBtID0gdGhpcy5sb2FkQXNGaWxlU3luYyhyZXMpIHx8IHRoaXMubG9hZEFzRGlyZWN0b3J5U3luYyhyZXMpIHx8IHRoaXMubG9hZE5vZGVNb2R1bGVzU3luYyh1cmwsIHJvb3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVhbHBhdGhTeW5jKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgdmFyIGVyciA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyB1cmwgKyBcIicgZnJvbSAnXCIgKyBwYXJlbnQgKyBcIidcIik7XHJcbiAgICAgICAgICAgIC8vICAgICBlcnIuY29kZSA9IFwiTU9EVUxFX05PVF9GT1VORFwiO1xyXG4gICAgICAgICAgICAvLyAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2FkQXNGaWxlU3luYyhwYXRobmFtZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRmlsZShwYXRobmFtZSkpIHJldHVybiBwYXRobmFtZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGUgPSBwYXRobmFtZS5sYXN0SW5kZXhPZihwYXRoLnNlcCkgKyAxO1xyXG4gICAgICAgICAgICBjb25zdCBmID0gYCR7cGF0aG5hbWUuc2xpY2UoMCwgZSl9XyR7cGF0aG5hbWUuc2xpY2UoZSl9YDtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0ZpbGUoZikpIHJldHVybiBmO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpbGU7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZXh0IG9mIHRoaXMuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgZmlsZSA9IHBhdGhuYW1lICsgZXh0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzRmlsZShmaWxlKSkgcmV0dXJuIGZpbGU7XHJcbiAgICAgICAgICAgICAgICBmaWxlID0gZiArIGV4dDtcclxuICAgICAgICAgICAgICAgIGlmIChpc0ZpbGUoZmlsZSkpIHJldHVybiBmaWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2FkQXNEaXJlY3RvcnlTeW5jKHBhdGhuYW1lKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwa2dmaWxlID0gcGF0aC5qb2luKGlzRGlyZWN0b3J5KHBhdGhuYW1lKSA/IHJlYWxwYXRoU3luYyhwYXRobmFtZSkgOiBwYXRobmFtZSwgXCIvcGFja2FnZS5qc29uXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRmlsZShwa2dmaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGtnID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGtnZmlsZSwgXCJ1dGYtOFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChpZ25vcmVkKSB7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocGtnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1haW4gPSBwa2cuc2FzcyB8fCBwa2cuc3R5bGUgfHwgcGtnLm1haW47XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYWluICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1haW5FcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJwYWNrYWdlIOKAnFwiICsgcGtnLm5hbWUgKyBcIuKAnSBgc2Fzcywgc3R5bGUgb3IgbWFpbmAgaXMgbm90IGEgc3RyaW5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluRXJyb3JbXCJjb2RlXCJdID0gXCJJTlZBTElEX1BBQ0tBR0VfTUFJTlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBtYWluRXJyb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWluID09PSBcIi5cIiB8fCBtYWluID09PSBcIi4vXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbiA9IFwiaW5kZXhcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbSA9IHRoaXMubG9hZEFzRmlsZVN5bmMocGF0aC5yZXNvbHZlKHBhdGhuYW1lLCBtYWluKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtKSByZXR1cm4gbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IHRoaXMubG9hZEFzRGlyZWN0b3J5U3luYyhwYXRoLnJlc29sdmUocGF0aG5hbWUsIG1haW4pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4pIHJldHVybiBuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFzRmlsZVN5bmMocGF0aC5qb2luKHBhdGhuYW1lLCBcIi9zdHlsZXMuc2Nzc1wiKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2FkTm9kZU1vZHVsZXNTeW5jKHVybCwgc3RhcnQpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgZGlyIG9mIG5vZGVNb2R1bGVzUGF0aHMoc3RhcnQsIHRoaXMsIHVybCkpIHtcclxuICAgICAgICAgICAgICAgIGRpciA9IHBhdGguam9pbihkaXIsIHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNEaXJlY3RvcnkocGF0aC5kaXJuYW1lKGRpcikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGlyZWN0b3J5KGRpcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFzRGlyZWN0b3J5U3luYyhkaXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvYWRBc0ZpbGVTeW5jKGRpcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNhc3NJbXBvcnRlcihiYXNlZmlsZTogc3RyaW5nKTpTeW5jSW1wb3J0ZXIge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodGhpczogU3luY0NvbnRleHQsIHVybDogc3RyaW5nLCBmaWxlOiBzdHJpbmcpOiBJbXBvcnRlclJldHVyblR5cGUge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGZpbGUgPT09IFwic3RkaW5cIiA/IGJhc2VmaWxlIDogZmlsZTtcclxuICAgICAgICAgICAgY29uc3QgYmFzZWRpciA9IHBhdGgucmVzb2x2ZShjb25maWcucm9vdERpciwgcGF0aC5kaXJuYW1lKGZpbGVuYW1lKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IHVybC5zdWJzdHJpbmcodXJsLmxhc3RJbmRleE9mKFwiLlwiKSk7XHJcbiAgICAgICAgICAgIGlmIChleHQgIT09IHVybCAmJiAhRVhURU5TSU9OUy5oYXMoZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZXIgPSBuZXcgUmVzb2x2ZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VkaXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uczogW2V4dF1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSByZXNvbHZlci5yZXNvbHZlKHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgb2JqO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChleHQgPT09IFwiLmpzb25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSByZXF1aXJlKHJlc29sdmVkKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4dCA9PT0gXCIuanNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBuZXcgSUlGRSgpLmltcG9ydChyZXNvbHZlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGZsYXRNYXAob2JqKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gYCQke2tleX06ICR7dmFsdWV9O2ApLmpvaW4oXCJcXG5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtjb250ZW50czogdmFyaWFibGVzfTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yKFwiY2Fubm90IHJlc29sdmUgc2FzcyBpbXBvcnQ6XCIsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlciA9IG5ldyBSZXNvbHZlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFzZWRpcixcclxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVyLnJlc29sdmUodXJsKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IHJlc29sdmVkLnN1YnN0cmluZyhyZXNvbHZlZC5sYXN0SW5kZXhPZihcIi5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcIi5jc3NcIiA9PT0gZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7Y29udGVudHM6IGZzLnJlYWRGaWxlU3luYyhyZXNvbHZlZCwgXCJ1dGYtOFwiKX07XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtmaWxlOiByZXNvbHZlZH07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZXJyb3IoXCJjYW5ub3QgcmVzb2x2ZSBzYXNzIGltcG9ydDpcIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtzYXNzSW1wb3J0ZXJ9O1xyXG59KTtcclxuIl19