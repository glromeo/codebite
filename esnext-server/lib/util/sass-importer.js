const log = require("tiny-node-logger");
const {memoize} = require("esnext-server-extras");

const path = require("path");
const fs = require("fs");
const babel = require("@babel/core");

const EXTENSIONS = new Set([".scss", ".sass", ".css"]);
const PATHS = [];

const IS_NOT_BARE = /^.?.?\//;
const isBare = url => !IS_NOT_BARE.test(url);

const IS_STYLE = /\.s?[ac]ss$/;
const isStyle = url => IS_STYLE.test(url);

module.exports.useSassImporter = memoize(config => {

    var realpathFS = typeof fs.realpathSync.native === "function" ? fs.realpathSync.native : fs.realpathSync;

    function realpathSync(x) {
        try {
            return realpathFS(x);
        } catch (realpathErr) {
            if (realpathErr.code !== "ENOENT") throw realpathErr;
        }
        return x;
    }

    function isFile(file) {
        try {
            const stat = fs.statSync(file);
            return stat.isFile() || stat.isFIFO();
        } catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
            throw e;
        }
    }

    function isDirectory(dir) {
        try {
            const stat = fs.statSync(dir);
            return stat.isDirectory();
        } catch (e) {
            if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
            throw e;
        }
    }

    function flatMap(obj) {
        const result = [];
        Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            if (typeof value === "object") {
                const cssText = value.cssText;
                if (cssText) {
                    result.push([key, cssText]);
                } else {
                    result.push(...flatMap(value).map(e => [key + "-" + e[0], e[1]]));
                }
            } else {
                result.push(entry);
            }
        });
        return result;
    }

    class IIFE {

        constructor(mocks = null) {
            Object.assign(this, IIFE.MOCK_MODULES, mocks);
        }

        static MOCK_MODULES = {
            litElement: {
                css: (strings, ...values) => ({
                    cssText: values.reduce((acc, v, idx) => acc + v + strings[idx + 1], strings[0])
                })
            }
        };

        static BABEL_OPTIONS = {
            plugins: [require("./sass-babel-plugin-iife.js")]
        };

        import(pathname) {
            const source = fs.readFileSync(pathname, "utf-8");
            const out = babel.transformSync(source, IIFE.BABEL_OPTIONS);
            eval(out.code);
            return this.default;
        }
    }


    const nodeModulesPaths = require("resolve/lib/node-modules-paths");

    class Resolver {

        constructor(options = null) {
            this.extensions = EXTENSIONS;
            this.paths = PATHS;
            Object.assign(this, options);
        }

        resolve(url) {

            const parent = this.filename !== "stdin" ? this.filename : this.basedir;
            const root = realpathSync(path.resolve(this.basedir));

            let m;
            if (url.startsWith("~")) {
                m = this.loadNodeModulesSync(url.substring(1), root);
            } else {
                var res = path.resolve(root, url);
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

            if (isFile(pathname)) return pathname;

            const e = pathname.lastIndexOf(path.sep) + 1;
            const f = `${pathname.slice(0, e)}_${pathname.slice(e)}`;

            if (isFile(f)) return f;

            let file;
            for (const ext of this.extensions) {
                file = pathname + ext;
                if (isFile(file)) return file;
                file = f + ext;
                if (isFile(file)) return file;
            }
        }

        loadAsDirectorySync(pathname) {

            const pkgfile = path.join(isDirectory(pathname) ? realpathSync(pathname) : pathname, "/package.json");

            if (isFile(pkgfile)) {
                try {
                    var pkg = JSON.parse(fs.readFileSync(pkgfile, "UTF8"));
                } catch (ignored) {
                }
                if (pkg) {
                    let main = pkg.sass || pkg.style || pkg.main;
                    if (typeof main !== "string") {
                        const mainError = new TypeError("package “" + pkg.name + "” `sass, style or main` is not a string");
                        mainError.code = "INVALID_PACKAGE_MAIN";
                        throw mainError;
                    }
                    if (main === "." || main === "./") {
                        main = "index";
                    }
                    try {
                        const m = this.loadAsFileSync(path.resolve(pathname, main));
                        if (m) return m;
                        const n = this.loadAsDirectorySync(path.resolve(pathname, main));
                        if (n) return n;
                    } catch (e) {
                    }
                }
            }
            return this.loadAsFileSync(path.join(pathname, "/styles.scss"));
        }

        loadNodeModulesSync(url, start) {
            for (let dir of nodeModulesPaths(start, this, url)) {
                dir = path.join(dir, url);
                if (isDirectory(path.dirname(dir))) {
                    if (isDirectory(dir)) {
                        return this.loadAsDirectorySync(dir);
                    } else {
                        return this.loadAsFileSync(dir);
                    }
                }
            }
        }
    }

    const sassImporter = (basefile) => {
        return function (url, file) {
            const filename = file === "stdin" ? basefile : file;
            const basedir = path.resolve(config.rootDir, path.dirname(filename));
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
                    } else if (ext === ".js") {
                        obj = new IIFE().import(resolved);
                    }
                    const variables = flatMap(obj).map(([key, value]) => `$${key}: ${value};`).join("\n");
                    return {contents: variables};
                } else {
                    log.error("cannot resolve sass import:", url);
                }
            } else {
                const resolver = new Resolver({
                    basedir,
                    filename: file
                });
                const resolved = resolver.resolve(url);
                if (resolved) {
                    const ext = resolved.substring(resolved.lastIndexOf("."));
                    if (".css" === ext) {
                        return {contents: fs.readFileSync(resolved, "UTF-8")};
                    } else {
                        return {file: resolved};
                    }
                } else {
                    log.error("cannot resolve sass import:", url);
                }
            }
        };
    };

    return {sassImporter};
});
