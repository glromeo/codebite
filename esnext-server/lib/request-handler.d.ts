/// <reference types="node" />
import { FSWatcher } from "chokidar";
import { IncomingMessage, OutgoingMessage } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { ESNextOptions } from "./configure";
export declare type RequestHandler = (request: IncomingMessage | Http2ServerRequest, response: OutgoingMessage | Http2ServerResponse) => void;
export declare function createRequestHandler(options: ESNextOptions, watcher: FSWatcher): RequestHandler;
