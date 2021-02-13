"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupPluginEsmProxy = void 0;
const esm_entry_proxy_1 = require("../src/esm-entry-proxy");
function rollupPluginEsmProxy({ entryModules }) {
    return {
        name: "rollup-plugin-esm-proxy",
        async buildStart(options) {
            await esm_entry_proxy_1.parseEsmReady;
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
                const { code, imports } = esm_entry_proxy_1.generateEsmProxy(entryId);
                return { code, meta: { "entry-proxy": { imports } } };
            }
            return null;
        }
    };
}
exports.rollupPluginEsmProxy = rollupPluginEsmProxy;
//# sourceMappingURL=rollup-plugin-esm-proxy.js.map