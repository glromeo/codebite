/// <reference types="node" />
import EventEmitter from "events";
import { WebModulesFactory, WebModulesNotification, WebModulesNotificationType, WebModulesOptions } from "./index";
export declare type EntryProxyResult = {
    code: string;
    imports: string[];
    external: string[];
};
export declare function defaultOptions(): WebModulesOptions;
export declare const notifications: EventEmitter;
export declare class Notification implements WebModulesNotification {
    private static counter;
    id: number;
    timeMs: number;
    sticky: boolean;
    type: WebModulesNotificationType;
    message: string;
    error?: Error;
    constructor(message: string, type?: WebModulesNotificationType, sticky?: boolean, error?: Error);
    update(message: string, type?: WebModulesNotificationType, sticky?: boolean): void;
}
export declare const useWebModules: WebModulesFactory;
