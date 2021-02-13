import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useBabelTransformer: (options: ESNextOptions, sourceMaps?: "inline" | "auto") => {
    babelTransformer: (filename: string, content: string) => Promise<TransformerOutput>;
};
