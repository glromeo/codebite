#!/usr/bin/env node
const log = require("@codebite/logger");
const {configure} = require("./configure.js");
const {startServer} = require("./server.js");

async function main() {

    const SHUTDOWN_TIMEOUT = 120000;
    const TERMINATED_BY_CTRL_C = 130;
    const CANNOT_EXECUTE = 126;

    try {
        const args = require("yargs")
            .scriptName("es-next-server")
            .usage("$0 <cmd> [args]")
            .option("config", {
                alias: ["c"],
                description: "Specify server config file (this will override base config as appropriate)",
                type: "string"
            })
            .option("root", {
                alias: ["rootDir", "r"],
                description: "root directory (defaults to the process current working directory)",
                type: "string"
            })
            .option("module", {
                alias: ["m"],
                description: "Add module to the server (a module is a server plugin)",
                type: "string"
            })
            .option("debug", {
                alias: ["d"],
                description: "debug",
                type: "boolean"
            })
            .help()
            .alias("help", "h").argv;

        const config = configure(args);

        const runtime = await startServer(config);

        /* NOTE: Jest doesn't let test easily the process handlers */

        /* istanbul ignore next */
        process.on("unhandledRejection", (reason, p) => {
            log.error("Unhandled Rejection at Promise", p, reason);
        });
        /* istanbul ignore next */
        process.on("uncaughtException", err => {
            log.error("Uncaught Exception thrown", err);
        });
        /* istanbul ignore next */
        process.on("SIGINT", async () => {
            log.info("ctrl+c detected...");
            await new Promise(done => {
                runtime.server.shutdown().then(done);
                setTimeout(done, SHUTDOWN_TIMEOUT);
            });
            process.exit(TERMINATED_BY_CTRL_C);
        });
        /* istanbul ignore next */
        process.on("exit", () => {
            log.info("done");
        });

        return runtime;

    } catch (error) {
        log.error("unable to start server", error);
        process.exit(CANNOT_EXECUTE);
    }
}

module.exports = main();
