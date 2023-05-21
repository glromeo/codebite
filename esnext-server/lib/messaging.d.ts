/// <reference types="nano-memoize" />
import { FSWatcher } from "chokidar";
import { ESNextOptions } from "./configure";
export type Message = {
    type: string;
    data?: any;
};
export type SendMessage = (type: string, data?: any) => void;
export type MessageCallback = (data: any, send: SendMessage) => void;
export type OnMessage = (type: string, cb: MessageCallback) => void;
export type MessagingContext = {
    on: OnMessage;
    broadcast: SendMessage;
    options: ESNextOptions;
    watcher: FSWatcher;
};
export type MessagingEndpoint = (messagingContext: MessagingContext) => void;
export type MessagingOptions = {
    plugins?: (MessagingEndpoint)[];
};
export declare const useMessaging: ((options: ESNextOptions) => {
    handleUpgrade(req: any, socket: any, head: any): void;
    broadcast: (type: string, data?: any) => void;
}) & import("nano-memoize").nanomemoize;
