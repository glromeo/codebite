/// <reference types="nano-memoize" />
import { ESNextOptions } from "../configure";
import { Resource } from "../providers/resource-provider";
import { CSS_CONTENT_TYPE, HTML_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE } from "../util/mime-types";
export type SourceMap = {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
};
export type TransformerOutput = {
    content: string;
    map?: SourceMap | null;
    headers: {
        "content-type": typeof JAVASCRIPT_CONTENT_TYPE | typeof HTML_CONTENT_TYPE | typeof CSS_CONTENT_TYPE;
        "content-length": number;
        "x-transformer": "babel-transformer" | "sass-transformer" | "html-transformer" | "esbuild-transformer";
    };
    links?: string[];
    includedFiles?: string[];
};
export declare const useTransformers: ((options: ESNextOptions) => {
    shouldTransform: ({ headers, pathname, query }: Resource) => boolean;
    transformContent: (resource: Resource) => Promise<SourceMap | null | undefined>;
}) & import("nano-memoize").nanomemoize;
