const fs = require("fs");
const path = require("path");

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

module.exports = args => {

    const baseDir = __dirname;
    const rootDir = args.root ? resolveDirectory(args.root) : process.cwd();

    const readTextFileSync = (filename) => {
        try {
            return fs.readFileSync(path.resolve(rootDir, filename), "UTF-8");
        } catch (ignored) {
            return fs.readFileSync(path.resolve(baseDir, filename), "UTF-8");
        }
    };

    return {

        baseDir,
        rootDir,

        log: {
            level: "info"
        },

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

        http2: "push",

        nodeModules: path.resolve(rootDir, "node_modules"),
        webModules: path.resolve(rootDir, "web_modules"),
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

        cors: {
            origin: "*",
            methods: "GET, HEAD, PUT, POST, DELETE, PATCH",
            headers: "X-Requested-With, Accept, Content-Type",
            credentials: true
        },

        clean: false,
        cache: true,
        deflate: true,

        etag: {
            weak: false
        },

        mount: {
            "/": rootDir,
        },

        middleware: [],

        proxy: {
            "/api": {target: "http://localhost:9000"}
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
        },

        web_modules: {
            standalone: [],
            terser: {
                mangle: true,
                output: {
                    comments: false
                }
            }
        }
    };
};
