import {init, parse as parseEsm} from "es-module-lexer";
import * as fs from "fs";
import * as path from "path";
import {Plugin} from "rollup";
import {isBare, pathnameToModuleUrl, toPosix} from "./es-import-utils";
import {EntryProxyResult} from "./esbuild-web-modules";

const parseEsmReady = init;

function scanEsm(
    filename: string,
    collected = new Set<string>(),
    imports = new Map<string, string[]>(),
    external:string[] = []
): { exports: Map<string, string[]>, external: string[] } {

    function notYetCollected(e) {
        return !collected.has(e) && collected.add(e);
    }

    function scanEsm(filename:string, module:string|null) {

        let source = fs.readFileSync(filename, "utf-8");
        let [
            imported,
            exported
        ] = parseEsm(source);

        for (const e of exported) if (e === "default" && module !== null) {
            external.push(module);
            return;
        }

        let resolveOptions = {paths: [path.dirname(filename)]};

        for (const {s, e} of imported) {
            let module = source.substring(s, e);
            if (!isBare(module)) {
                if (module === "..") {
                    module = "../index";
                } else if (module === ".") {
                    module = "./index";
                }
                const filename = require.resolve(module, resolveOptions);
                if (!imports.has(filename)) {
                    scanEsm(filename, module);
                }
            }
        }

        imports.set(filename, exported.filter(notYetCollected));
    }

    scanEsm(filename, null);
    return {exports: imports, external};
}


export type PluginEsmProxyOptions = {
    entryModules: Set<string>
}

export function generateEsmProxy(entryId: string): EntryProxyResult {
    const {exports, external} = scanEsm(entryId);
    let code = "";
    let imports: string[] = [];
    for (const [filename, exported] of exports.entries()) {
        let moduleUrl = pathnameToModuleUrl(filename);
        if (exported.length > 0) {
            code += `export {\n${exported.join(",\n")}\n} from "${moduleUrl}";\n`;
        }
        imports.push(moduleUrl);
    }
    if (entryId.endsWith("redux-toolkit.esm.js")) {
        code += `export * from "redux";`;
    }
    return {
        code: code || fs.readFileSync(entryId, "utf-8"),
        imports,
        external
    };
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
                const {code, imports} = generateEsmProxy(entryId);
                return {code, meta: {"entry-proxy": {imports}}};
            }
            return null;
        }
    };
}
