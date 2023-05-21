import { BuildOptions } from "esbuild";
import { Opts } from "resolve";
import { ImportMap } from "./utility";
export type WebModulesOptions = {
    rootDir: string;
    clean?: boolean;
    init?: boolean;
    environment?: string;
    resolve: Opts;
    external?: string | string[];
    squash?: string[];
    esbuild?: BuildOptions;
    notify?: boolean;
};
export type ImportResolver = (url: string, importer?: string) => Promise<string>;
export type WebModulesAPI = {
    options: WebModulesOptions;
    outDir: string;
    importMap: ImportMap;
    resolveImport: ImportResolver;
    bundleWebModule: (source: string) => Promise<void>;
};
export type WebModulesFactory = (options?: WebModulesOptions) => WebModulesAPI;
export type WebModulesNotificationType = "primary" | "secondary" | "info" | "success" | "warning" | "danger";
export interface WebModulesNotification {
    id: number;
    timeMs: number;
    sticky: boolean;
    type: WebModulesNotificationType;
    message: string;
}
export { notifications } from "./notifications";
export { isBare, parseModuleUrl, pathnameToModuleUrl, toPosix } from "./es-import-utils";
export { useWebModulesPlugin } from "./babel-plugin-web-modules";
export { useWebModules } from "./web-modules";
