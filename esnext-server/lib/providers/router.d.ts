import { ESNextOptions } from "../configure";
import { Resource } from "./resource-provider";
export declare function useRouter(options: ESNextOptions): {
    route: (url: string) => Promise<Resource>;
};
