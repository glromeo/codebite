import zlib from "fast-zlib";
import memoize from "pico-memoize";
import {ESNextOptions} from "../configure";

export const useZlib = memoize((options:ESNextOptions)=>{

    function createCompression(encoding: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined) {
        if (encoding === "deflate") return new zlib.Deflate();
        else if (encoding === "gzip") return new zlib.Gzip();
        else if (encoding === "br") return new zlib.BrotliCompress();
        else throw new Error(`encoding '${encoding}' not supported.`);
    }

    function applyCompression(content: string | Buffer, encoding = options.encoding) {
        let compress = createCompression(encoding);
        try {
            return compress.process(content);
        } finally {
            compress.close();
        }
    }

    return {
        applyCompression
    }
});