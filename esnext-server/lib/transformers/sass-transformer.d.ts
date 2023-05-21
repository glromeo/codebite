/// <reference types="nano-memoize" />
import { ESNextOptions } from "../configure";
import { TransformerOutput } from "./index";
export declare const useSassTransformer: ((options: ESNextOptions) => {
    sassTransformer: (filename: string, content: string, type: any) => Promise<TransformerOutput>;
}) & import("nano-memoize").nanomemoize;
