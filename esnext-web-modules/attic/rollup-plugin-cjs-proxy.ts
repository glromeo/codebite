import {Plugin} from "rollup";
import {generateCjsProxy, parseCjsReady, PluginCjsProxyOptions} from "../src/cjs-entry-proxy";

/**
 *              _ _             _____  _             _        _____ _     _____
 *             | | |           |  __ \| |           (_)      / ____(_)   |  __ \
 *    _ __ ___ | | |_   _ _ __ | |__) | |_   _  __ _ _ _ __ | |     _ ___| |__) | __ _____  ___   _
 *   | '__/ _ \| | | | | | '_ \|  ___/| | | | |/ _` | | '_ \| |    | / __|  ___/ '__/ _ \ \/ / | | |
 *   | | | (_) | | | |_| | |_) | |    | | |_| | (_| | | | | | |____| \__ \ |   | | | (_) >  <| |_| |
 *   |_|  \___/|_|_|\__,_| .__/|_|    |_|\__,_|\__, |_|_| |_|\_____| |___/_|   |_|  \___/_/\_\\__, |
 *                       | |                    __/ |             _/ |                         __/ |
 *                       |_|                   |___/             |__/                         |___/
 *
 * @param entryModules
 */
export function rollupPluginCjsProxy({entryModules}: PluginCjsProxyOptions): Plugin {
    return {
        name: "rollup-plugin-cjs-proxy",
        async buildStart(options) {
            await parseCjsReady;
        },
        async resolveId(source, importer) {
            if (!importer && source.charCodeAt(0) !== 0) {
                let resolution = await this.resolve(source, undefined, {skipSelf: true});
                if (resolution) {
                    return `${resolution.id}?cjs-proxy`;
                }
            }
            return null;
        },
        load(id) {
            if (id.endsWith("?cjs-proxy")) {
                const entryId = id.slice(0, -10);
                const {code, imports} = generateCjsProxy(entryId);
                return {code, meta: {"entry-proxy": {imports}}};
            }
            return null;
        }
    };
}
