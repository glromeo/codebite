/// <reference types="nano-memoize" />
import Router, { Req, Res } from "find-my-way";
import { ESNextOptions } from "./configure";
type Version = Router.HTTPVersion.V1 | Router.HTTPVersion.V2;
export declare const useRequestHandler: (<V extends Version>(options: ESNextOptions) => (req: Router.Req<V>, res: Router.Res<V>) => void) & import("nano-memoize").nanomemoize;
export {};
