/// <reference types="nano-memoize" />
import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useEsBuildTransformer: ((options: ESNextOptions, sourceMaps?: "inline" | "auto") => {
    esbuildTransformer: (filename: string, content: string) => Promise<TransformerOutput>;
}) & import("nano-memoize").nanomemoize;
