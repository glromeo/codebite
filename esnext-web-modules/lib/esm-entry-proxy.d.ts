import { EntryProxyResult } from "./web-modules";
export declare const parseEsmReady: Promise<void>;
export type PluginEsmProxyOptions = {
    entryModules: Set<string>;
};
export declare function generateEsmProxy(entryId: string): EntryProxyResult;
