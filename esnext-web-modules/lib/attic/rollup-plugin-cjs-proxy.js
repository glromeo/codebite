"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupPluginCjsProxy = void 0;
const cjs_entry_proxy_1 = require("../src/cjs-entry-proxy");
function rollupPluginCjsProxy({ entryModules }) {
    return {
        name: "rollup-plugin-cjs-proxy",
        async buildStart(options) {
            await cjs_entry_proxy_1.parseCjsReady;
        },
        async resolveId(source, importer) {
            if (!importer && source.charCodeAt(0) !== 0) {
                let resolution = await this.resolve(source, undefined, { skipSelf: true });
                if (resolution) {
                    return `${resolution.id}?cjs-proxy`;
                }
            }
            return null;
        },
        load(id) {
            if (id.endsWith("?cjs-proxy")) {
                const entryId = id.slice(0, -10);
                const { code, imports } = cjs_entry_proxy_1.generateCjsProxy(entryId);
                return { code, meta: { "entry-proxy": { imports } } };
            }
            return null;
        }
    };
}
exports.rollupPluginCjsProxy = rollupPluginCjsProxy;
//# sourceMappingURL=rollup-plugin-cjs-proxy.js.map