import Router, { Req, Res } from "find-my-way";
import { ESNextOptions } from "./configure";
export declare const useRequestHandler: <V extends Router.HTTPVersion>(options: ESNextOptions) => (req: Router.Req<V>, res: Router.Res<V>) => void;
