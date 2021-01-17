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
exports.rollupPluginEsmProxy = exports.generateEsmProxy = void 0;
const es_module_lexer_1 = require("es-module-lexer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const es_import_utils_1 = require("./es-import-utils");
const parseEsmReady = es_module_lexer_1.init;
function scanEsm(filename, collected = new Set(), imports = new Map(), external = []) {
    function notYetCollected(e) {
        return !collected.has(e) && collected.add(e);
    }
    function scanEsm(filename, module) {
        let source = fs.readFileSync(filename, "utf-8");
        let [imported, exported] = es_module_lexer_1.parse(source);
        for (const e of exported)
            if (e === "default" && module !== null) {
                external.push(module);
                return;
            }
        let resolveOptions = { paths: [path.dirname(filename)] };
        for (const { s, e } of imported) {
            let module = source.substring(s, e);
            if (!es_import_utils_1.isBare(module)) {
                if (module === "..") {
                    module = "../index";
                }
                else if (module === ".") {
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
    return { exports: imports, external };
}
function generateEsmProxy(entryId) {
    const { exports, external } = scanEsm(entryId);
    let code = "";
    let imports = [];
    for (const [filename, exported] of exports.entries()) {
        let moduleUrl = es_import_utils_1.pathnameToModuleUrl(filename);
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
exports.generateEsmProxy = generateEsmProxy;
function rollupPluginEsmProxy({ entryModules }) {
    return {
        name: "rollup-plugin-esm-proxy",
        async buildStart(options) {
            await parseEsmReady;
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
                const { code, imports } = generateEsmProxy(entryId);
                return { code, meta: { "entry-proxy": { imports } } };
            }
            return null;
        }
    };
}
exports.rollupPluginEsmProxy = rollupPluginEsmProxy;
//# sourceMappingURL=rollup-plugin-esm-proxy.js.map