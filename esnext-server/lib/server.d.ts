/// <reference types="node" />
import { FSWatcher } from "chokidar";
import Router, { Handler, HTTPVersion } from "find-my-way";
import { Server as HttpServer } from "http";
import { Http2Server } from "http2";
import { Server as HttpsServer } from "https";
import { ESNextOptions } from "./configure";
export declare type ServerOptions = {
    protocol?: "http" | "https";
    host?: string;
    port?: number;
    options?: {
        key?: string;
        cert?: string;
        allowHTTP1?: boolean;
    };
};
export declare const DEFAULT_SERVER_OPTIONS: ServerOptions;
export declare type Services = {
    watcher?: FSWatcher;
    handler?: Handler<HTTPVersion.V1 | HTTPVersion.V2>;
};
export declare function startServer(options: ESNextOptions, services?: Services): Promise<{
    config: ESNextOptions;
    module: any;
    server: HttpServer | Http2Server | HttpsServer;
    watcher: FSWatcher;
    handler: Router.Handler<Router.HTTPVersion> | ((req: import("http").IncomingMessage, res: import("http").ServerResponse) => void);
    address: string;
    shutdown: (this: any) => Promise<any>;
}>;
