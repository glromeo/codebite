import { FSWatcher } from "chokidar";
import Router, { Req, Res } from "find-my-way";
import { ESNextOptions } from "./configure";
export declare function createRequestHandler<V extends Router.HTTPVersion = Router.HTTPVersion.V1>(options: ESNextOptions, watcher: FSWatcher): (req: Req<V>, res: Res<V>) => void;
