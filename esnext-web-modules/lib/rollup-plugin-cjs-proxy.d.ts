import { Plugin } from "rollup";
import { EntryProxyResult } from "./esbuild-web-modules";
export declare type PluginCjsProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateCjsProxy(entryId: string): EntryProxyResult;
export declare function rollupPluginCjsProxy({ entryModules }: PluginCjsProxyOptions): Plugin;
