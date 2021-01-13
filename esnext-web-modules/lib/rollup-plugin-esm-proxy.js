"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupPluginEsmProxy = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const es_import_utils_1 = require("./es-import-utils");
function scanEsm(filename, exportsByFilename = new Map(), exports = new Set()) {
    let source = fs.readFileSync(filename, "utf-8");
    let [imported, exported] = es_module_lexer_1.parse(source);
    let uniqueExports = exportsByFilename.get(filename) || [];
    for (const e of exported) {
        if (e === "default") {
            exportsByFilename.set(filename, null);
            return exportsByFilename;
        }
        else if (!exports.has(e)) {
            uniqueExports.push(e);
            exports.add(e);
        }
    }
    exportsByFilename.set(filename, uniqueExports);
    for (const { s, e } of imported) {
        let module = source.substring(s, e);
        if (!es_import_utils_1.isBare(module)) {
            if (module === "..") {
                module = "../index";
            }
            else if (module === ".") {
                module = "./index";
            }
            let importedFilename = require.resolve(module, { paths: [path.dirname(filename)] });
            if (!exportsByFilename.has(importedFilename)) {
                scanEsm(importedFilename, exportsByFilename, exports);
            }
        }
    }
    return exportsByFilename;
}
function rollupPluginEsmProxy({ entryModules }) {
    return {
        name: "rollup-plugin-esm-proxy",
        async buildStart(options) {
            await es_module_lexer_1.init;
        },
        async resolveId(source, importer) {
            if (!importer) {
                let resolution = await this.resolve(source, importer, { skipSelf: true });
                if (resolution) {
                    return `${resolution.id}?esm-proxy`;
                }
            }
            return null;
        },
        load(id) {
            if (id.endsWith("?esm-proxy")) {
                const entryId = id.slice(0, -10);
                const entryUrl = es_import_utils_1.toPosix(entryId);
                const exportsByFilename = scanEsm(entryId);
                const excluded = new Set();
                let proxy = "";
                for (const [filename, exports] of exportsByFilename.entries()) {
                    if (exports === null) {
                        excluded.add(filename);
                        continue;
                    }
                    if (exports.length > 0) {
                        let importUrl = es_import_utils_1.toPosix(filename);
                        proxy += `export {\n${exports.join(",\n")}\n} from "${importUrl}";\n`;
                    }
                }
                if (entryUrl.endsWith("redux-toolkit.esm.js")) {
                    proxy += `export * from "redux";`;
                }
                return {
                    code: proxy || fs.readFileSync(entryId, "utf-8"),
                    meta: { "entry-proxy": { bundle: [...exportsByFilename.keys()].filter(f => !excluded.has(f)).map(es_import_utils_1.bareNodeModule) } }
                };
            }
            return null;
        }
    };
}
exports.rollupPluginEsmProxy = rollupPluginEsmProxy;
//# sourceMappingURL=rollup-plugin-esm-proxy.js.map