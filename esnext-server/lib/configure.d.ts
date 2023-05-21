import { TransformOptions } from "@babel/core";
import { FSWatcher, WatchOptions } from "chokidar";
import { CorsOptions } from "cors";
import { WebModulesOptions } from "esnext-web-modules";
import { Options } from "etag";
import Router, { HTTPVersion } from "find-my-way";
import Server from "http-proxy";
import { ServerOptions } from "./server";
import { MessagingOptions } from "./messaging";
import { LegacyOptions } from "sass";
export type FindMyWayMiddleware = (router: Router.Instance<HTTPVersion.V1 | HTTPVersion.V2>, options: ESNextOptions, watcher: FSWatcher) => void;
export type ESNextOptions = WebModulesOptions & {
    rootDir: string;
    log?: {
        level: "trace" | "debug" | "info" | "warn" | "error" | "nothing";
        details?: boolean;
        compact?: boolean;
    };
    http2?: "push" | "preload" | false;
    server?: ServerOptions;
    resources: string;
    watcher?: WatchOptions;
    router: Router.Config<HTTPVersion.V1 | HTTPVersion.V2>;
    middleware: FindMyWayMiddleware[];
    proxy: {
        [path: string]: Server.ServerOptions;
    };
    cors: CorsOptions;
    etag: Options;
    cache?: boolean;
    encoding: "gzip" | "brotli" | "br" | "deflate" | "deflate-raw" | undefined;
    transform: {
        include: string | string[];
        exclude: string | string[];
        preProcess?(filename: string, code: string): string;
    };
    mount: {
        [path: string]: string;
    };
    babel: TransformOptions;
    sass: LegacyOptions<'sync'> & {
        moduleType?: "style";
    };
    messaging?: MessagingOptions;
    plugins: (ESNextOptions | string)[];
};
export declare function defaultOptions(args: Args): ESNextOptions;
export type Args = {
    config?: string;
    root?: string;
    plugin?: string | string[];
    debug?: boolean;
    production?: boolean;
};
export declare function configure(args?: Args, override?: any): Readonly<ESNextOptions>;
