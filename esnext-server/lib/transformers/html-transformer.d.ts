/// <reference types="nano-memoize" />
import { TransformerOutput } from "./index";
export type TransformResult = {
    html: string;
    imports: Set<string>;
};
export declare const useHtmlTransformer: ((config: any) => {
    htmlTransformer: (filename: string, content: string) => Promise<TransformerOutput>;
}) & import("nano-memoize").nanomemoize;
