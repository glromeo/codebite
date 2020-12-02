const log = require("@codebite/logger");
const {parsePathname} = require("@codebite/utility");
const {useWebModules} = require("@codebite/web-modules");
const {existsSync, readdirSync, promises: fs} = require("fs");
const path = require("path");
const mime = require("@codebite/utility");

const HttpStatus = require("http-status-codes");

module.exports.useWorkspaceFiles = config => {

    const {
        rootDir = process.cwd(),
        mount = {}
    } = config;

    const {resolveWebModule} = useWebModules(config);

    const regExp = /\/[^/?]+/;

    async function resolve(pathname) {
        const match = regExp.exec(pathname);
        if (match) {
            const segment = match[0];
            if (segment === "/web_modules") {
                const {module, filename} = parsePathname(pathname.substring(13));

                log.debug`resolving: ${module}/${filename}`;

                const webPkg = await resolveWebModule(module);
                const resolved = await webPkg.resolve(filename);

                if (webPkg.local) {
                    return {route: "/", filename: path.join(rootDir, resolved)};
                }

                if (resolved !== filename)
                    throw {
                        code: HttpStatus.PERMANENT_REDIRECT,
                        headers: {"location": path.posix.join(segment, module, resolved)}
                    };

                return {route: segment, filename: path.join(rootDir, pathname)};

            } else if (mount[segment]) {
                return {route: segment, filename: path.join(mount[segment], pathname.substring(segment.length))};
            }
        }
        return {route: "/", filename: path.join(rootDir, pathname)};
    }

    async function readWorkspaceFile(pathname) {

        const {route, filename} = await resolve(pathname);

        const stats = await fs.stat(filename).catch(error => {
            if (error.code === "ENOENT") {
                if (pathname === "/favicon.ico") {
                    throw {code: HttpStatus.PERMANENT_REDIRECT, headers: {"location": "/resources/javascript.png"}};
                } else {
                    throw {code: HttpStatus.NOT_FOUND, message: error.stack};
                }
            } else {
                throw {code: HttpStatus.INTERNAL_SERVER_ERROR, message: error.stack};
            }
        });

        if (stats.isDirectory()) {
            let location;
            try {
                const {home} = require(path.resolve(filename, "package.json"));
                location = path.posix.join(pathname, home || "index.html");
            } catch (ignored) {
                location = path.posix.join(pathname, "index.html");
            }
            throw {code: HttpStatus.PERMANENT_REDIRECT, headers: {"location": location}};
        } else {
            return {
                filename,
                content: await fs.readFile(filename, "UTF-8"),
                headers: {
                    "content-type": mime.contentType(filename),
                    "content-length": stats.size,
                    "last-modified": stats.mtime.toUTCString(),
                    "cache-control": route === "/web_modules" ? "public, max-age=86400, immutable" : "no-cache"
                }
            };
        }
    }

    return {
        readWorkspaceFile
    };
};
