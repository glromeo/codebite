import { Resource } from "../util/resource-cache";
export declare function useWorkspaceFiles(config: any): {
    readWorkspaceFile: (pathname: any) => Promise<Resource>;
};
