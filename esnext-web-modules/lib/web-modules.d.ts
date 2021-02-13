import { WebModulesFactory } from "./index";
export declare type EntryProxyResult = {
    code: string;
    imports: string[];
    external: string[];
};
export declare function defaultOptions(): any;
export declare const useWebModules: WebModulesFactory;
