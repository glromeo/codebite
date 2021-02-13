import { BuildOptions } from "esbuild";
import { Opts } from "resolve";
import { ImportMap } from "./utility";
export declare type WebModulesOptions = {
    rootDir: string;
    clean?: boolean;
    init?: boolean;
    environment: string;
    resolve: Opts;
    external: string | string[];
    squash?: string[];
    esbuild?: BuildOptions;
};
export declare type ImportResolver = (url: string, basedir?: string) => Promise<string>;
export declare type WebModulesAPI = {
    options: WebModulesOptions;
    outDir: string;
    importMap: ImportMap;
    resolveImport: ImportResolver;
    esbuildWebModule: (source: string) => Promise<void>;
};
export declare type WebModulesFactory = (options: WebModulesOptions) => WebModulesAPI;
export { isBare, pathnameToModuleUrl, toPosix, parseModuleUrl } from "./es-import-utils";
export { useWebModulesPlugin } from "./babel-plugin-web-modules";
export { useWebModules } from "./web-modules";
