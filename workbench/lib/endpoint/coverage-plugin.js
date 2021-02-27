const log = require("tiny-node-logger");
const fs = require("fs");
const path = require("path");

const NYC = require("nyc");

module.exports = function CoveragePlugin(config, watcher) {

    const {rootDir} = config;

    const outDir = path.resolve(rootDir, ".nyc_output");
    const out = path.resolve(outDir, "out.json");

    fs.mkdirSync(outDir, {recursive: true});

    const writeCoverage = function (spec, coverage) {
        fs.writeFileSync(out, JSON.stringify(coverage));
    }

    const nyc = new NYC({
        reporter: "html",
        cwd: rootDir,
        tempDir: outDir,
        reportDir: "coverage"
    });

    return {
        async coverage(payload) {
            const {spec, coverage} = payload;
            writeCoverage(spec, coverage);
            await nyc.report();
            log.info("nyc report done");
        }
    }
};
