import { SyncImporter } from "node-sass";
export declare const useSassImporter: (config: any) => {
    sassImporter: (basefile: string) => SyncImporter;
};
