/// <reference types="nano-memoize" />
import { LegacySyncImporter } from "sass/types/legacy/importer";
export declare const useSassImporter: ((config: any) => {
    sassImporter: (basefile: string) => LegacySyncImporter;
}) & import("nano-memoize").nanomemoize;
