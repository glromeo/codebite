import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useSassTransformer: (options: ESNextOptions) => {
    sassTransformer: (filename: any, content: any, type: any, userAgent?: any) => Promise<TransformerOutput>;
};
