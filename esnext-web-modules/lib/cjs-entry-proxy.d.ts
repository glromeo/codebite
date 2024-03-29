import { EntryProxyResult } from "./web-modules";
export declare const parseCjsReady: Promise<void>;
export type PluginCjsProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateCjsProxy(entryId: string): EntryProxyResult;
