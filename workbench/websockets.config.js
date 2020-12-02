const log = require("tiny-node-logger");
const fastGlob = require("fast-glob");
const fs = require("fs");
const path = require("path");
const debounce = require("debounce");

module.exports = function (config, watcher, on) {

    const {rootDir} = config;

    const DEFAULT_SPECS_PATTERN = [
        "**/*.test.mjs",
        "**/*.test.js",
        "**/*.spec.mjs",
        "**/*.spec.js"
    ];

    const specs = config.specs || DEFAULT_SPECS_PATTERN;

    on("connected", (payload, send) => {
        const reload = debounce(path => send("reload", {changed: path}));
        watcher.on("change", reload);
        watcher.on("unlink", reload);
    });

    on("find", async (payload, send) => {
        const prefix = path.relative(rootDir, process.cwd());
        const entries = await fastGlob(specs, {cwd: process.cwd(), objectMode: true});
        send("specs", entries.map(entry => {
            return `/${path.join(prefix, entry.path).replace(/\\/g, "/")}`;
        }));
    });

    require("./lib/endpoint/coverage-reporter.js").apply(this, arguments);
};
