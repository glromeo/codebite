import { Plugin } from "rollup";
export declare type PluginEsmProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateEsmProxy(entryId: string): {
    code: string;
    meta: {
        "entry-proxy": {
            bundle: string[];
        };
    };
};
export declare function rollupPluginEsmProxy({ entryModules }: PluginEsmProxyOptions): Plugin;
