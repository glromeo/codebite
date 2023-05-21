/// <reference types="node" />
/// <reference types="node" />
/// <reference types="nano-memoize" />
import { OutgoingHttpHeaders } from "http";
import { ESNextOptions } from "../configure";
export type Query = {
    [name: string]: string;
};
export type Resource = {
    pathname: string;
    query: Query;
    filename: string;
    content: string | Buffer;
    headers: OutgoingHttpHeaders;
    links: readonly string[];
    watch?: readonly string[];
    onchange?: () => void;
};
export declare const NO_LINKS: readonly never[];
export declare const NO_QUERY: Readonly<{}>;
export declare const useResourceProvider: ((options: ESNextOptions) => {
    provideResource(url: string): Promise<Resource>;
}) & import("nano-memoize").nanomemoize;
