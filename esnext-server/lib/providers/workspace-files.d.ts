export declare function useWorkspaceFiles(config: any): {
    readWorkspaceFile: (pathname: any) => Promise<{
        filename: string;
        content: string;
        headers: {
            "content-type": any;
            "content-length": number;
            "last-modified": string;
            "cache-control": string;
        };
    }>;
};
