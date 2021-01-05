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
//# sourceMappingURL=sass-importer.js.map