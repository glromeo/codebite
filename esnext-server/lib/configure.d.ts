import { TransformOptions } from "@babel/core";
import { FSWatcher, WatchOptions } from "chokidar";
import { CorsOptions } from "cors";
import { WebModulesOptions } from "esnext-web-modules";
import { Options } from "etag";
import Router, { HTTPVersion } from "find-my-way";
import Server from "http-proxy";
import { SyncOptions } from "node-sass";
import { ServerOptions } from "./server";
export declare type ESNextOptions = WebModulesOptions & {
    rootDir: string;
    log?: {
        level: "trace" | "debug" | "info" | "warn" | "error" | "nothing";
        details?: boolean;
        compact?: boolean;
    };
    http2?: "push" | "preload" | false;
    server?: ServerOptions;
    resources?: string;
    watcher?: WatchOptions;
    router: Router.Config<HTTPVersion.V2>;
    middleware: ((router: Router.Instance<HTTPVersion.V2>, options: ESNextOptions, watcher: FSWatcher) => void)[];
    proxy: {
        [path: string]: Server.ServerOptions;
    };
    cors: CorsOptions;
    etag: Options;
    cache?: boolean;
    deflate?: boolean;
    transform: {
        include: string | string[];
        exclude: string | string[];
    };
    mount: {
        [path: string]: string;
    };
    babel: TransformOptions;
    sass: SyncOptions;
};
export declare function defaultOptions(args: Args): ESNextOptions;
export declare type Args = {
    config?: string;
    root?: string;
    module?: string | string[];
    debug?: boolean;
    production?: boolean;
};
export declare function configure(args?: Args, override?: any): Readonly<ESNextOptions>;
