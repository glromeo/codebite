import { Plugin } from "rollup";
export declare type PluginCjsProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateCjsProxy(entryId: string): {
    code: string;
    meta: {
        "entry-proxy": {
            bundle: string[];
        };
    };
};
export declare function rollupPluginCjsProxy({ entryModules }: PluginCjsProxyOptions): Plugin;
