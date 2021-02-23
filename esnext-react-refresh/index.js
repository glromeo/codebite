import reactRefreshRuntime from "./lib/runtime.js";
import * as hmr from "esnext-server-client";

reactRefreshRuntime.injectIntoGlobalHook(window);

window.$RefreshSig$ = reactRefreshRuntime.createSignatureFunctionForTransform;

export function createHotContext(url) {
    const [pathname] = url.split("?");
    window.$RefreshReg$ = (type, id) => reactRefreshRuntime.register(type, pathname + " " + id);
    return hmr.createHotContext(url);
}

let timeout;

export function performReactRefresh() {
    clearTimeout(timeout);
    timeout = setTimeout(reactRefreshRuntime.performReactRefresh, 25);
}
