import { BuildOptions } from "esbuild";
import { Opts } from "resolve";
export interface ImportMap {
    imports: {
        [packageName: string]: string;
    };
}
export declare type WebModulesOptions = {
    rootDir: string;
    clean?: boolean;
    environment: string;
    resolve: Opts;
    external: string | string[];
    esbuild: BuildOptions;
};
export declare type ImportResolver = (url: string, basedir?: string) => Promise<string>;
export declare function defaultOptions(): WebModulesOptions;
export declare const useWebModules: (options?: WebModulesOptions) => {
    outDir: string;
    importMap: {
        imports: {
            [x: string]: string;
        };
    };
    resolveImport: (url: string, basedir?: string) => Promise<string>;
    esbuildWebModule: (source: string) => Promise<void>;
};
