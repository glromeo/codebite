import {init, parse as parseEsm} from "es-module-lexer";
import * as fs from "fs";
import * as path from "path";
import {Plugin} from "rollup";
import {bareNodeModule, isBare, toPosix} from "./es-import-utils";

const parseEsmReady = init;

function scanEsm(
    filename: string,
    exportsByFilename = new Map<string, string[]|null>(),
    exports = new Set<string>()
): Map<string, string[]|null> {
    let source = fs.readFileSync(filename, "utf-8");
    let [
        imported,
        exported
    ] = parseEsm(source);

    let uniqueExports: string[] = exportsByFilename.get(filename) || [];
    for (const e of exported) {
        if (e === "default") {
            exportsByFilename.set(filename, null);
            return exportsByFilename;
        } else if (!exports.has(e)) {
            uniqueExports.push(e);
            exports.add(e);
        }
    }

    exportsByFilename.set(filename, uniqueExports);

    for (const {s, e} of imported) {
        let module = source.substring(s, e);
        if (!isBare(module)) {
            if (module === "..") {
                module = "../index";
            } else if (module === ".") {
                module = "./index";
            }
            let importedFilename = require.resolve(module, {paths: [path.dirname(filename)]});
            if (!exportsByFilename.has(importedFilename)) {
                scanEsm(importedFilename, exportsByFilename, exports);
            }
        }
    }

    return exportsByFilename;
}

export type PluginEsmProxyOptions = {
    entryModules: Set<string>
}

/**
 *              _ _             _____  _             _       ______               _____
 *             | | |           |  __ \| |           (_)     |  ____|             |  __ \
 *    _ __ ___ | | |_   _ _ __ | |__) | |_   _  __ _ _ _ __ | |__   ___ _ __ ___ | |__) | __ _____  ___   _
 *   | '__/ _ \| | | | | | '_ \|  ___/| | | | |/ _` | | '_ \|  __| / __| '_ ` _ \|  ___/ '__/ _ \ \/ / | | |
 *   | | | (_) | | | |_| | |_) | |    | | |_| | (_| | | | | | |____\__ \ | | | | | |   | | | (_) >  <| |_| |
 *   |_|  \___/|_|_|\__,_| .__/|_|    |_|\__,_|\__, |_|_| |_|______|___/_| |_| |_|_|   |_|  \___/_/\_\\__, |
 *                       | |                    __/ |                                                  __/ |
 *                       |_|                   |___/                                                  |___/
 *
 * @param entryModules
 */
export function rollupPluginEsmProxy({entryModules}: PluginEsmProxyOptions): Plugin {
    return {
        name: "rollup-plugin-esm-proxy",
        async buildStart(options) {
            await parseEsmReady;
        },
        async resolveId(source, importer) {
            if (!importer) {
                let resolution = await this.resolve(source, importer, {skipSelf: true});
                if (resolution) {
                    return `${resolution.id}?esm-proxy`;
                }
            }
            return null;
        },
        load(id) {
            if (id.endsWith("?esm-proxy")) {
                const entryId = id.slice(0, -10);
                const entryUrl = toPosix(entryId);
                const exportsByFilename = scanEsm(entryId);
                const excluded = new Set<string>();
                let proxy = "";
                for (const [filename, exports] of exportsByFilename.entries()) {
                    if (exports === null) {
                        excluded.add(filename);
                        continue;
                    }
                    if (exports.length > 0) {
                        let importUrl = toPosix(filename);
                        proxy += `export {\n${exports.join(",\n")}\n} from "${importUrl}";\n`;
                    }
                }
                if (entryUrl.endsWith("redux-toolkit.esm.js")) {
                    proxy += `export * from "redux";`;
                }
                return {
                    code: proxy || fs.readFileSync(entryId, "utf-8"),
                    meta: {"entry-proxy": {bundle: [...exportsByFilename.keys()].filter(f => !excluded.has(f)).map(bareNodeModule)}}
                };
            }
            return null;
        }
    };
}
