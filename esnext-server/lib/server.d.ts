/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { FSWatcher } from "chokidar";
import { Handler, HTTPVersion } from "find-my-way";
import { Server as HttpServer } from "http";
import { Http2Server } from "http2";
import { Server as HttpsServer } from "https";
import { ESNextOptions } from "./configure";
export type ServerOptions = {
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
export type Services = {
    watcher?: FSWatcher;
    handler?: Handler<HTTPVersion.V1 | HTTPVersion.V2>;
};
export declare function startServer(options: ESNextOptions): Promise<{
    options: ESNextOptions;
    module: any;
    server: HttpServer<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> | HttpsServer<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> | Http2Server;
    watcher: FSWatcher;
    handler: (req: import("http").IncomingMessage | import("http2").Http2ServerRequest, res: import("http").ServerResponse | import("http2").Http2ServerResponse) => void;
    address: string;
    shutdown: (this: any) => Promise<any>;
}>;
