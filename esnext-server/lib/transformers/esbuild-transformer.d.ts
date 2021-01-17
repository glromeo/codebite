import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useEsBuildTransformer: (options: ESNextOptions, sourceMaps?: "inline" | "auto") => {
    esbuildTransformer: (filename: any, content: any) => Promise<TransformerOutput>;
};
