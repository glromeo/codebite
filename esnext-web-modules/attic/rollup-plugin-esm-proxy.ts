import {Plugin} from "rollup";
import {generateEsmProxy, parseEsmReady, PluginEsmProxyOptions} from "../src/esm-entry-proxy";

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
