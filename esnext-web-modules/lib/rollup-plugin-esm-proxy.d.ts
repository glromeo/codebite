import { Plugin } from "rollup";
import { EntryProxyResult } from "./esbuild-web-modules";
export declare type PluginEsmProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateEsmProxy(entryId: string): EntryProxyResult;
export declare function rollupPluginEsmProxy({ entryModules }: PluginEsmProxyOptions): Plugin;
