import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useBabelTransformer: (options: ESNextOptions, sourceMaps?: "inline" | "auto") => {
    babelTransformer: (filename: any, content: any) => Promise<TransformerOutput>;
};
