import {useWebModules} from "esnext-web-modules/lib/esbuild-web-modules";
import {promises as fs} from "fs";
import {OutgoingHttpHeaders} from "http";
import HttpStatus from "http-status-codes";
import path from "path";
import {contentType} from "../util/mime-types";
import {Resource} from "../util/resource-cache";

export function useWorkspaceFiles(config) {

    const {esbuildWebModule} = useWebModules(config);

    const {
        rootDir = process.cwd(),
        mount = {}
    } = config;

    const regExp = /\/[^/?]+/;

    async function resolve(pathname) {
        const match = regExp.exec(pathname);
        if (match) {
            const segment = match[0];
            if (segment === "/web_modules") {
                return {route: segment, filename: path.join(rootDir, pathname)};
            } else if (segment === "/workspaces") {
                return {route: segment, filename: path.join(rootDir, pathname.substring("/workspaces".length))};
            } else if (mount[segment]) {
                return {route: segment, filename: path.join(mount[segment], pathname.substring(segment.length))};
            }
        }
        return {route: "/", filename: path.join(rootDir, pathname)};
    }

    async function readWorkspaceFile(pathname):Promise<Resource> {

        const {route, filename} = await resolve(pathname);

        const stats = await fs.stat(filename).catch(error => {
            if (error.code === "ENOENT") {
                if (route === "/web_modules") {
                    return esbuildWebModule(pathname.substring(13)).then(() => fs.stat(filename));
                }
            }
            throw error;
        }).catch(error => {
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
                content: await fs.readFile(filename),
                headers: {
                    "content-type": contentType(filename),
                    "content-length": stats.size,
                    "last-modified": stats.mtime.toUTCString(),
                    "cache-control": route === "/web_modules" ? "public, max-age=86400, immutable" : "no-cache"
                } as OutgoingHttpHeaders
            } as Resource;
        }
    }

    return {
        readWorkspaceFile
    };
}
