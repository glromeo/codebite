"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSassImporter = void 0;
const core_1 = __importDefault(require("@babel/core"));
const fs_1 = __importDefault(require("fs"));
const pico_memoize_1 = __importDefault(require("pico-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const EXTENSIONS = new Set([".scss", ".sass", ".css"]);
const PATHS = [];
exports.useSassImporter = pico_memoize_1.default(config => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1pbXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL3Nhc3MtaW1wb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdURBQWdDO0FBQ2hDLDRDQUFvQjtBQUNwQixnRUFBbUM7QUFFbkMsZ0RBQXdCO0FBQ3hCLHdFQUFtQztBQUVuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN2RCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7QUFFSixRQUFBLGVBQWUsR0FBRyxzQkFBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBRTVDLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxZQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFFLENBQUMsWUFBWSxDQUFDO0lBRWpILFNBQVMsWUFBWSxDQUFDLENBQUM7UUFDbkIsSUFBSTtZQUNBLE9BQU8sZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDOUI7UUFBQyxPQUFPLFdBQVcsRUFBRTtZQUNsQixJQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssUUFBUTtnQkFBRSxNQUFNLFdBQVcsQ0FBQztTQUN4RDtRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsTUFBTSxDQUFDLElBQUk7UUFDaEIsSUFBSTtZQUNBLE1BQU0sSUFBSSxHQUFHLFlBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ3pDO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJ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LEdBQUcsQ0FBQyxDQUFDO29CQUM5QyxPQUFPLElBQUksQ0FBQztpQkFDZjthQUNKO2lCQUFNO2dCQUNILE1BQU0sUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDO29CQUMxQixPQUFPO29CQUNQLFFBQVEsRUFBRSxJQUFJO2lCQUNqQixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxRQUFRLEVBQUU7b0JBQ1YsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzFELElBQUksTUFBTSxLQUFLLEdBQUcsRUFBRTt3QkFDaEIsT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBQyxDQUFDO3FCQUN6RDt5QkFBTTt3QkFDSCxPQUFPLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDO3FCQUMzQjtpQkFDSjtxQkFBTTtvQkFDSCwwQkFBRyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDOUMsT0FBTyxJQUFJLENBQUM7aUJBQ2Y7YUFDSjtRQUNMLENBQUMsQ0FBQztJQUNOLENBQUM7SUFFRCxPQUFPLEVBQUMsWUFBWSxFQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmFiZWwgZnJvbSBcIkBiYWJlbC9jb3JlXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IG1lbW9pemUgZnJvbSBcInBpY28tbWVtb2l6ZVwiO1xyXG5pbXBvcnQge0ltcG9ydGVyUmV0dXJuVHlwZSwgU3luY0NvbnRleHQsIFN5bmNJbXBvcnRlcn0gZnJvbSBcIm5vZGUtc2Fzc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XHJcblxyXG5jb25zdCBFWFRFTlNJT05TID0gbmV3IFNldChbXCIuc2Nzc1wiLCBcIi5zYXNzXCIsIFwiLmNzc1wiXSk7XHJcbmNvbnN0IFBBVEhTID0gW107XHJcblxyXG5leHBvcnQgY29uc3QgdXNlU2Fzc0ltcG9ydGVyID0gbWVtb2l6ZShjb25maWcgPT4ge1xyXG5cclxuICAgIGNvbnN0IHJlYWxwYXRoU3luY0ltcGwgPSB0eXBlb2YgZnMucmVhbHBhdGhTeW5jLm5hdGl2ZSA9PT0gXCJmdW5jdGlvblwiID8gZnMucmVhbHBhdGhTeW5jLm5hdGl2ZSA6IGZzLnJlYWxwYXRoU3luYztcclxuXHJcbiAgICBmdW5jdGlvbiByZWFscGF0aFN5bmMoeCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWFscGF0aFN5bmNJbXBsKHgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKHJlYWxwYXRoRXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChyZWFscGF0aEVyci5jb2RlICE9PSBcIkVOT0VOVFwiKSB0aHJvdyByZWFscGF0aEVycjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNGaWxlKGZpbGUpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0LmlzRmlsZSgpIHx8IHN0YXQuaXNGSUZPKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoZSAmJiAoZS5jb2RlID09PSBcIkVOT0VOVFwiIHx8IGUuY29kZSA9PT0gXCJFTk9URElSXCIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzRGlyZWN0b3J5KGRpcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhkaXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdC5pc0RpcmVjdG9yeSgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUgJiYgKGUuY29kZSA9PT0gXCJFTk9FTlRcIiB8fCBlLmNvZGUgPT09IFwiRU5PVERJUlwiKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmbGF0TWFwKG9iaikge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogW3N0cmluZywgc3RyaW5nXVtdID0gW107XHJcbiAgICAgICAgT2JqZWN0LmVudHJpZXM8Q1NTUnVsZSB8IHN0cmluZz4ob2JqKS5mb3JFYWNoKGVudHJ5ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gZW50cnk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFtrZXksIHZhbHVlXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjc3NUZXh0ID0gdmFsdWUuY3NzVGV4dDtcclxuICAgICAgICAgICAgICAgIGlmIChjc3NUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goW2tleSwgY3NzVGV4dF0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBmbGF0TWFwKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChbYCR7a2V5fS0ke2t9YCwgdl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgSUlGRSB7XHJcblxyXG4gICAgICAgIHN0YXRpYyBNT0NLX01PRFVMRVMgPSB7XHJcbiAgICAgICAgICAgIGxpdEVsZW1lbnQ6IHtcclxuICAgICAgICAgICAgICAgIGNzczogKHN0cmluZ3MsIC4uLnZhbHVlcykgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICBjc3NUZXh0OiB2YWx1ZXMucmVkdWNlKChhY2MsIHYsIGlkeCkgPT4gYWNjICsgdiArIHN0cmluZ3NbaWR4ICsgMV0sIHN0cmluZ3NbMF0pXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3RhdGljIEJBQkVMX09QVElPTlMgPSB7XHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtyZXF1aXJlKFwiLi9zYXNzLWJhYmVsLXBsdWdpbi1paWZlXCIpXVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRlZmF1bHQ/OiBzdHJpbmc7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKG1vY2tzID0gbnVsbCkge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIElJRkUuTU9DS19NT0RVTEVTLCBtb2Nrcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbXBvcnQocGF0aG5hbWUpIHtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlID0gZnMucmVhZEZpbGVTeW5jKHBhdGhuYW1lLCBcInV0Zi04XCIpO1xyXG4gICAgICAgICAgICBjb25zdCBvdXQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKHNvdXJjZSwgSUlGRS5CQUJFTF9PUFRJT05TKTtcclxuICAgICAgICAgICAgaWYgKG91dD8uY29kZSkge1xyXG4gICAgICAgICAgICAgICAgZXZhbChvdXQuY29kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGNvbnN0IG5vZGVNb2R1bGVzUGF0aHMgPSByZXF1aXJlKFwicmVzb2x2ZS9saWIvbm9kZS1tb2R1bGVzLXBhdGhzXCIpO1xyXG5cclxuICAgIGNsYXNzIFJlc29sdmVyIHtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBiYXNlZGlyOiBzdHJpbmc7XHJcbiAgICAgICAgcHJpdmF0ZSBmaWxlbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIHByaXZhdGUgcGF0aHM6IHN0cmluZ1tdO1xyXG4gICAgICAgIHByaXZhdGUgZXh0ZW5zaW9uczogU2V0PHN0cmluZz47XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiB7XHJcbiAgICAgICAgICAgIGJhc2VkaXI6IHN0cmluZ1xyXG4gICAgICAgICAgICBmaWxlbmFtZTogc3RyaW5nXHJcbiAgICAgICAgICAgIGV4dGVuc2lvbnM/OiBzdHJpbmdbXVxyXG4gICAgICAgICAgICBwYXRocz86IHN0cmluZ1tdXHJcbiAgICAgICAgfSkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VkaXIgPSBvcHRpb25zPy5iYXNlZGlyID8/IHByb2Nlc3MuY3dkKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsZW5hbWUgPSBvcHRpb25zPy5maWxlbmFtZSA/PyBcInN0ZGluXCI7XHJcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IG9wdGlvbnM/LmV4dGVuc2lvbnMgPyBuZXcgU2V0KG9wdGlvbnMuZXh0ZW5zaW9ucykgOiBFWFRFTlNJT05TO1xyXG4gICAgICAgICAgICB0aGlzLnBhdGhzID0gb3B0aW9ucz8ucGF0aHMgPz8gUEFUSFM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXNvbHZlKHVybCkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5maWxlbmFtZSAhPT0gXCJzdGRpblwiID8gdGhpcy5maWxlbmFtZSA6IHRoaXMuYmFzZWRpcjtcclxuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IHJlYWxwYXRoU3luYyhwYXRoLnJlc29sdmUodGhpcy5iYXNlZGlyKSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgbTtcclxuICAgICAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKFwiflwiKSkge1xyXG4gICAgICAgICAgICAgICAgbSA9IHRoaXMubG9hZE5vZGVNb2R1bGVzU3luYyh1cmwuc3Vic3RyaW5nKDEpLCByb290KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXMgPSBwYXRoLnJlc29sdmUocm9vdCwgdXJsKTtcclxuICAgICAgICAgICAgICAgIGlmICh1cmwgPT09IFwiLlwiIHx8IHVybCA9PT0gXCIuLlwiIHx8IHVybC5zbGljZSgtMSkgPT09IFwiL1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9IFwiL1wiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbSA9IHRoaXMubG9hZEFzRmlsZVN5bmMocmVzKSB8fCB0aGlzLmxvYWRBc0RpcmVjdG9yeVN5bmMocmVzKSB8fCB0aGlzLmxvYWROb2RlTW9kdWxlc1N5bmModXJsLCByb290KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlYWxwYXRoU3luYyhtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgdXJsICsgXCInIGZyb20gJ1wiICsgcGFyZW50ICsgXCInXCIpO1xyXG4gICAgICAgICAgICAvLyAgICAgZXJyLmNvZGUgPSBcIk1PRFVMRV9OT1RfRk9VTkRcIjtcclxuICAgICAgICAgICAgLy8gICAgIHRocm93IGVycjtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZEFzRmlsZVN5bmMocGF0aG5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0ZpbGUocGF0aG5hbWUpKSByZXR1cm4gcGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBlID0gcGF0aG5hbWUubGFzdEluZGV4T2YocGF0aC5zZXApICsgMTtcclxuICAgICAgICAgICAgY29uc3QgZiA9IGAke3BhdGhuYW1lLnNsaWNlKDAsIGUpfV8ke3BhdGhuYW1lLnNsaWNlKGUpfWA7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNGaWxlKGYpKSByZXR1cm4gZjtcclxuXHJcbiAgICAgICAgICAgIGxldCBmaWxlO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiB0aGlzLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgIGZpbGUgPSBwYXRobmFtZSArIGV4dDtcclxuICAgICAgICAgICAgICAgIGlmIChpc0ZpbGUoZmlsZSkpIHJldHVybiBmaWxlO1xyXG4gICAgICAgICAgICAgICAgZmlsZSA9IGYgKyBleHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNGaWxlKGZpbGUpKSByZXR1cm4gZmlsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZEFzRGlyZWN0b3J5U3luYyhwYXRobmFtZSkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGtnZmlsZSA9IHBhdGguam9pbihpc0RpcmVjdG9yeShwYXRobmFtZSkgPyByZWFscGF0aFN5bmMocGF0aG5hbWUpIDogcGF0aG5hbWUsIFwiL3BhY2thZ2UuanNvblwiKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0ZpbGUocGtnZmlsZSkpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBrZyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrZ2ZpbGUsIFwidXRmLThcIikpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHBrZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYWluID0gcGtnLnNhc3MgfHwgcGtnLnN0eWxlIHx8IHBrZy5tYWluO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYWluRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwicGFja2FnZSDigJxcIiArIHBrZy5uYW1lICsgXCLigJ0gYHNhc3MsIHN0eWxlIG9yIG1haW5gIGlzIG5vdCBhIHN0cmluZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkVycm9yW1wiY29kZVwiXSA9IFwiSU5WQUxJRF9QQUNLQUdFX01BSU5cIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbWFpbkVycm9yO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFpbiA9PT0gXCIuXCIgfHwgbWFpbiA9PT0gXCIuL1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW4gPSBcImluZGV4XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG0gPSB0aGlzLmxvYWRBc0ZpbGVTeW5jKHBhdGgucmVzb2x2ZShwYXRobmFtZSwgbWFpbikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobSkgcmV0dXJuIG07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLmxvYWRBc0RpcmVjdG9yeVN5bmMocGF0aC5yZXNvbHZlKHBhdGhuYW1lLCBtYWluKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuKSByZXR1cm4gbjtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvYWRBc0ZpbGVTeW5jKHBhdGguam9pbihwYXRobmFtZSwgXCIvc3R5bGVzLnNjc3NcIikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZE5vZGVNb2R1bGVzU3luYyh1cmwsIHN0YXJ0KSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGRpciBvZiBub2RlTW9kdWxlc1BhdGhzKHN0YXJ0LCB0aGlzLCB1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBkaXIgPSBwYXRoLmpvaW4oZGlyLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzRGlyZWN0b3J5KHBhdGguZGlybmFtZShkaXIpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RpcmVjdG9yeShkaXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvYWRBc0RpcmVjdG9yeVN5bmMoZGlyKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkQXNGaWxlU3luYyhkaXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzYXNzSW1wb3J0ZXIoYmFzZWZpbGU6IHN0cmluZyk6U3luY0ltcG9ydGVyIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRoaXM6IFN5bmNDb250ZXh0LCB1cmw6IHN0cmluZywgZmlsZTogc3RyaW5nKTogSW1wb3J0ZXJSZXR1cm5UeXBlIHtcclxuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBmaWxlID09PSBcInN0ZGluXCIgPyBiYXNlZmlsZSA6IGZpbGU7XHJcbiAgICAgICAgICAgIGNvbnN0IGJhc2VkaXIgPSBwYXRoLnJlc29sdmUoY29uZmlnLnJvb3REaXIsIHBhdGguZGlybmFtZShmaWxlbmFtZSkpO1xyXG4gICAgICAgICAgICBjb25zdCBleHQgPSB1cmwuc3Vic3RyaW5nKHVybC5sYXN0SW5kZXhPZihcIi5cIikpO1xyXG4gICAgICAgICAgICBpZiAoZXh0ICE9PSB1cmwgJiYgIUVYVEVOU0lPTlMuaGFzKGV4dCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVyID0gbmV3IFJlc29sdmVyKHtcclxuICAgICAgICAgICAgICAgICAgICBiYXNlZGlyLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtleHRdXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZXIucmVzb2x2ZSh1cmwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc29sdmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9iajtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXh0ID09PSBcIi5qc29uXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gcmVxdWlyZShyZXNvbHZlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChleHQgPT09IFwiLmpzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gbmV3IElJRkUoKS5pbXBvcnQocmVzb2x2ZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBmbGF0TWFwKG9iaikubWFwKChba2V5LCB2YWx1ZV0pID0+IGAkJHtrZXl9OiAke3ZhbHVlfTtgKS5qb2luKFwiXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7Y29udGVudHM6IHZhcmlhYmxlc307XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5lcnJvcihcImNhbm5vdCByZXNvbHZlIHNhc3MgaW1wb3J0OlwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZXIgPSBuZXcgUmVzb2x2ZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VkaXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSByZXNvbHZlci5yZXNvbHZlKHVybCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBleHQgPSByZXNvbHZlZC5zdWJzdHJpbmcocmVzb2x2ZWQubGFzdEluZGV4T2YoXCIuXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCIuY3NzXCIgPT09IGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2NvbnRlbnRzOiBmcy5yZWFkRmlsZVN5bmMocmVzb2x2ZWQsIFwidXRmLThcIil9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7ZmlsZTogcmVzb2x2ZWR9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLmVycm9yKFwiY2Fubm90IHJlc29sdmUgc2FzcyBpbXBvcnQ6XCIsIHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7c2Fzc0ltcG9ydGVyfTtcclxufSk7XHJcbiJdfQ==