/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
export declare function useWorkspaceFiles(config: any): {
    readWorkspaceFile: (pathname: any) => Promise<{
        filename: string;
        content: string;
        headers: OutgoingHttpHeaders;
    }>;
};
