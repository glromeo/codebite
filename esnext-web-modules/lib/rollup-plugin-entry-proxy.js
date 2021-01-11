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
exports.rollupPluginEntryProxy = void 0;
const cjs_module_lexer_1 = require("cjs-module-lexer");
const es_module_lexer_1 = require("es-module-lexer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const es_import_utils_1 = require("./es-import-utils");
const parseCjsReady = cjs_module_lexer_1.init();
function scanCjs(filename, collected = new Set()) {
    let source = fs.readFileSync(filename, "utf-8");
    let { exports, reexports } = cjs_module_lexer_1.parse(source);
    for (const e of exports) {
        collected.add(e);
    }
    for (let required of reexports) {
        if (!es_import_utils_1.isBare(required)) {
            if (required === "..") {
                required = "../index";
            }
            else if (required === ".") {
                required = "./index";
            }
            let requiredFilename = require.resolve(required, { paths: [path.dirname(filename)] });
            scanCjs(requiredFilename, collected);
        }
    }
    return collected;
}
function scanEsm(filename, exportsByFilename = new Map(), exports = new Set()) {
    let source = fs.readFileSync(filename, "utf-8");
    let [moduleImports, moduleExports] = es_module_lexer_1.parse(source);
    let uniqueExports = [];
    for (const e of moduleExports)
        if (!exports.has(e)) {
            uniqueExports.push(e);
            exports.add(e);
        }
    exportsByFilename.set(filename, uniqueExports);
    for (const { s, e } of moduleImports) {
        let moduleImport = source.substring(s, e);
        if (!es_import_utils_1.isBare(moduleImport)) {
            if (moduleImport === "..") {
                moduleImport = "../index";
            }
            else if (moduleImport === ".") {
                moduleImport = "./index";
            }
            let importedFilename = require.resolve(moduleImport, { paths: [path.dirname(filename)] });
            if (!exportsByFilename.has(importedFilename)) {
                scanEsm(importedFilename, exportsByFilename, exports);
            }
        }
    }
    return exportsByFilename;
}
function rollupPluginEntryProxy({ manifest, entryModules }) {
    return {
        name: "rollup-plugin-entry-proxy",
        async buildStart(options) {
            await es_module_lexer_1.init;
            await parseCjsReady;
        },
        async resolveId(source, importer) {
            if (!importer && entryModules.has(source)) {
                let resolution = await this.resolve(source, importer, { skipSelf: true });
                if (resolution) {
                    return `${resolution.id}?esm-proxy`;
                }
            }
            return null;
        },
        load(id) {
            if (id.endsWith("?esm-proxy")) {
                const imported = id.slice(0, -10);
                const exportsByFilename = scanEsm(imported);
                let proxy = "";
                for (const [filename, exports] of exportsByFilename.entries()) {
                    if (exports.length > 0) {
                        let importUrl = es_import_utils_1.toPosix(filename);
                        proxy += `export {\n${exports.join(",\n")}\n} from "${importUrl}";\n`;
                    }
                }
                return proxy || fs.readFileSync(imported, "utf-8");
            }
            if (id.endsWith("?cjs-proxy")) {
                const entryId = id.slice(0, -10);
                const entryUrl = es_import_utils_1.toPosix(entryId);
                const exports = scanCjs(entryId);
                exports.delete("__esModule");
                let proxy = "";
                if (!exports.has("default")) {
                    proxy += `import __default__ from "${entryUrl}";\nexport default __default__;\n`;
                }
                if (exports.size > 0) {
                    proxy += `export {\n${Array.from(exports).join(",\n")}\n} from "${entryUrl}";\n`;
                }
                return proxy || fs.readFileSync(entryId, "utf-8");
            }
            return null;
        }
    };
}
exports.rollupPluginEntryProxy = rollupPluginEntryProxy;
//# sourceMappingURL=rollup-plugin-entry-proxy.js.map