import Router, { HTTPVersion } from "find-my-way";
import { ESNextOptions } from "./configure";
export declare function createRouter<V extends HTTPVersion = HTTPVersion.V1>(options: ESNextOptions): Router.Instance<V>;
