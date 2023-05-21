/// <reference types="nano-memoize" />
import { ServerHttp2Stream } from "http2";
import { ESNextOptions } from "../configure";
export declare const useHttp2Push: ((options: ESNextOptions) => {
    http2Push: (stream: ServerHttp2Stream, pathname: any, urls: readonly string[]) => void;
}) & import("nano-memoize").nanomemoize;
