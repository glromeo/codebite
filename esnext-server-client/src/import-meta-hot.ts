import {on} from "./messaging";

export type UpdateCallback = ({module}) => void;

const updateCallbacks = new Map<string, UpdateCallback>();

export function createHotContext(fullUrl: string) {
    let id = new URL(fullUrl).pathname;
    return {
        accept(cb: UpdateCallback) {
            updateCallbacks.set(id, cb);
        }
    };
}

on("hmr:update", ({url}) => {
    console.log("[HMR] update", url);
    const updateID = Date.now();
    import(url + `?mtime=${updateID}`).then(module => {
        const updateCallback = updateCallbacks.get(url);
        if (updateCallback) {
            updateCallback(module);
        } else {
            console.log("[HMR] reload", url);
            // location.reload();
        }
    });
})

on("hmr:reload", ({url}) => {
    console.log("[HMR] reload", url);
    // location.reload();
})
