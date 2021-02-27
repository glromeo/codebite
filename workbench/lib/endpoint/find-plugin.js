const log = require("tiny-node-logger");
const fastGlob = require("fast-glob");
const fs = require("fs");
const path = require("path");

module.exports = function FindPlugin(config, watcher) {

    const DEFAULT_SPECS_PATTERN = [
        "**/*.test.mjs",
        "**/*.test.js",
        "**/*.spec.mjs",
        "**/*.spec.js"
    ];

    const rootDir = config.rootDir;
    const specs = config.specs || DEFAULT_SPECS_PATTERN;

    return {
        async find(payload, send) {
            const prefix = path.relative(rootDir, process.cwd());
            const entries = await fastGlob(specs, {cwd: process.cwd(), objectMode: true});
            send("specs", entries.map(entry => {
                return `/${path.join(prefix, entry.path).replace(/\\/g, "/")}`;
            }));
        }
    }
};

