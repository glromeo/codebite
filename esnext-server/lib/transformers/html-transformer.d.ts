import { TransformerOutput } from "./index";
export declare type TransformResult = {
    html: string;
    imports: Set<string>;
};
export declare const useHtmlTransformer: (config: any) => {
    htmlTransformer: (filename: any, content: any) => Promise<TransformerOutput>;
};
