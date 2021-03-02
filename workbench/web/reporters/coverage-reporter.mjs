import {send} from "esnext-server-client";

export default () => ({

    jasmineDone(runDetails) {
        const {searchParams} = new URL(document.location);
        const spec = searchParams.get("spec");
        send("coverage", {spec: spec, coverage: window.__coverage__});
    }
});
