/// <reference types="node" />
import { ESNextOptions } from "../configure";
export declare const useZlib: (options: ESNextOptions) => {
    applyCompression: (content: string | Buffer, encoding?: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined) => Buffer;
};
