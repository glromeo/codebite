import backbone from "../backbone.js";

export default () => ({

    jasmineDone(runDetails) {
        const {searchParams} = new URL(document.location);
        const spec = searchParams.get("spec");
        backbone.ready.then(() => {
            backbone.send("coverage", {spec: spec, coverage: window.__coverage__});
        });
    }
});
