/// <reference types="node" />
/// <reference types="nano-memoize" />
import { ESNextOptions } from "../configure";
export declare const useZlib: ((options: ESNextOptions) => {
    applyCompression: (content: string | Buffer, encoding?: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined) => Buffer;
}) & import("nano-memoize").nanomemoize;
