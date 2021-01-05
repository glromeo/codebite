import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useBabelTransformer: (options: ESNextOptions, sourceMaps?: boolean | "inline") => {
    babelTransformer: (filename: any, content: any) => Promise<TransformerOutput>;
};
