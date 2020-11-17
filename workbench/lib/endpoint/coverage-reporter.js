const log = require("@codebite/logger");
const fs = require("fs");
const path = require("path");

const NYC = require("nyc");

module.exports = function (config, watcher, on) {

    const {rootDir} = config;

    const outDir = path.resolve(rootDir, ".nyc_output");
    const out = path.resolve(outDir, "out.json");

    fs.mkdirSync(outDir, {recursive: true});

    on("coverage", async (payload) => {

        const {spec, coverage} = payload;

        fs.writeFileSync(out, JSON.stringify(coverage));

        const nyc = new NYC({
            reporter: "html",
            cwd: rootDir,
            tempDir: outDir,
            reportDir: "coverage"
        });

        await nyc.report();

        log.info("nyc report done");
    });
};
