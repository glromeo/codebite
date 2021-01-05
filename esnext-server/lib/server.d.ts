/// <reference types="node" />
import { FSWatcher } from "chokidar";
import { Server as HttpServer } from "http";
import { Http2Server } from "http2";
import { Server as HttpsServer } from "https";
import { ESNextOptions } from "./configure";
import { RequestHandler } from "./request-handler";
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
    handler?: RequestHandler;
};
export declare function startServer(options: ESNextOptions, services?: Services): Promise<{
    config: ESNextOptions;
    module: any;
    server: HttpServer | HttpsServer | Http2Server;
    watcher: FSWatcher;
    handler: RequestHandler;
    address: string;
    shutdown: (this: any) => Promise<any>;
}>;
